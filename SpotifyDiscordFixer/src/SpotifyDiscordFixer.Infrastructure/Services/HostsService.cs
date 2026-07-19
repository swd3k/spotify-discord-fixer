using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using SpotifyDiscordFixer.Core.Hosts;
using SpotifyDiscordFixer.Core.Models;
using SpotifyDiscordFixer.Infrastructure.Storage;

namespace SpotifyDiscordFixer.Infrastructure.Services;

/// <summary>
/// System hosts read/write for the managed Spotify Discord Fixer block.
/// Backup → Downloads; elevate via PowerShell runas when not admin (Windows).
/// </summary>
public sealed class HostsService
{
    private readonly string _hostsPath;
    private string? _backupDirOverride;

    public HostsService(string? hostsPathOverride = null)
    {
        _hostsPath = hostsPathOverride ?? DefaultHostsPath();
    }

    public string HostsPath => _hostsPath;

    public void SetBackupDirectory(string dir)
    {
        _backupDirOverride = dir;
        try { Directory.CreateDirectory(dir); } catch { /* ignore */ }
    }

    public string ResolveBackupDir()
    {
        string dir = _backupDirOverride ?? AppPaths.DefaultDownloadsDir();
        try { Directory.CreateDirectory(dir); } catch { /* ignore */ }
        return dir;
    }

    public static string DefaultHostsPath()
    {
        string root = Environment.GetEnvironmentVariable("SystemRoot")
                      ?? Environment.GetEnvironmentVariable("windir")
                      ?? @"C:\Windows";
        return Path.Combine(root, "System32", "drivers", "etc", "hosts");
    }

    public bool? GetStatus()
    {
        try
        {
            if (!File.Exists(_hostsPath)) return false;
            string content = File.ReadAllText(_hostsPath);
            return content.Contains(HostsBlock.StartMarker, StringComparison.Ordinal);
        }
        catch
        {
            return null;
        }
    }

    public ParsedBlock? GetActiveBlock()
    {
        try
        {
            if (!File.Exists(_hostsPath)) return null;
            return HostsBlock.ExtractBlock(File.ReadAllText(_hostsPath));
        }
        catch
        {
            return null;
        }
    }

    public bool CanWriteHostsDirectly()
    {
        try
        {
            using var fs = new FileStream(_hostsPath, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public OperationResult Apply(IEnumerable<string> ips)
    {
        var list = ips.Where(HostsBlock.ValidateIp).Distinct(StringComparer.Ordinal).ToList();
        string? ip = list.FirstOrDefault();
        if (ip is null)
            return OperationResult.Fail("Нет валидных IP для применения.");

        try
        {
            var (stripped, backupPath) = RunHostsAction(HostsAction.Apply, HostsBlock.BuildBlock(new[] { ip }));
            bool verified = VerifyRedirect(HostsBlock.SpotifyDomains[0], ip);
            string verifyNote = verified
                ? $"Проверка: {HostsBlock.SpotifyDomains[0]} → {ip}, перенаправление работает."
                : $"Внимание: проверка {HostsBlock.SpotifyDomains[0]} не подтвердила перенаправление (возможно, нужен сброс кэша DNS).";
            string stripNote = stripped > 0
                ? $" Удалено старых конфликтующих записей Spotify: {stripped}."
                : "";
            return OperationResult.Ok(
                $"Применён узел {ip} для {HostsBlock.SpotifyDomains.Count} доменов.{stripNote} " +
                $"Бэкап: {backupPath}. {verifyNote} Перезапустите Discord и Spotify.");
        }
        catch (Exception ex)
        {
            return OperationResult.Fail(
                $"{ex.Message} Запустите программу от имени администратора.",
                detail: ex.ToString());
        }
    }

    public OperationResult Remove()
    {
        try
        {
            var (_, backupPath) = RunHostsAction(HostsAction.Remove);
            return OperationResult.Ok(
                $"Блок #spotify-discord-hosts удалён. Восстановлен стандартный DNS. " +
                $"Бэкап: {backupPath}. Ручные Spotify-строки вне блока не трогались.");
        }
        catch (Exception ex)
        {
            return OperationResult.Fail(
                $"{ex.Message} Запустите программу от имени администратора.",
                detail: ex.ToString());
        }
    }

    /// <summary>Backup current hosts to Downloads (or override). Returns full path.</summary>
    public string BackupHostsFile()
    {
        if (!File.Exists(_hostsPath))
            throw new FileNotFoundException($"Файл hosts не найден: {_hostsPath}", _hostsPath);

        string dir = ResolveBackupDir();
        Directory.CreateDirectory(dir);
        string name = HostsBlock.BackupFileName();
        string dest = Path.Combine(dir, name);
        int n = 1;
        while (File.Exists(dest))
        {
            string bas = name.EndsWith(".txt", StringComparison.OrdinalIgnoreCase)
                ? name[..^4]
                : name;
            dest = Path.Combine(dir, $"{bas}_{n}.txt");
            n++;
        }

        byte[] data = File.ReadAllBytes(_hostsPath);
        File.WriteAllBytes(dest, data);
        if (!File.Exists(dest) || (new FileInfo(dest).Length == 0 && data.Length > 0))
            throw new IOException($"Не удалось создать бэкап hosts: {dest}");

        PruneOldBackups(dir, keep: 5);
        return dest;
    }

    private static void PruneOldBackups(string dir, int keep)
    {
        try
        {
            var files = Directory.GetFiles(dir, "hosts_backup_*.txt")
                .Select(f => new FileInfo(f))
                .OrderByDescending(f => f.LastWriteTimeUtc)
                .Skip(keep);
            foreach (var f in files)
            {
                try { f.Delete(); } catch { /* ignore */ }
            }
        }
        catch { /* ignore */ }
    }

    private (int strippedConflicts, string backupPath) RunHostsAction(HostsAction action, string block = "")
    {
        if (!File.Exists(_hostsPath))
            throw new FileNotFoundException($"Файл hosts не найден: {_hostsPath}", _hostsPath);

        string backupPath = BackupHostsFile();
        string raw = File.ReadAllText(_hostsPath);
        var prepared = HostsBlock.PrepareHostsContent(raw, action, block);

        if (CanWriteHostsDirectly())
        {
            try
            {
                File.WriteAllText(_hostsPath, prepared.Content, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
                FlushDns();
                return (prepared.StrippedConflicts, backupPath);
            }
            catch (UnauthorizedAccessException)
            {
                // fall through to elevated write
            }
            catch (IOException ex) when (IsPermission(ex))
            {
                // fall through
            }
        }

        WriteHostsElevated(prepared.Content);
        FlushDns();
        return (prepared.StrippedConflicts, backupPath);
    }

    private static bool IsPermission(Exception ex) =>
        ex.Message.Contains("denied", StringComparison.OrdinalIgnoreCase)
        || ex.Message.Contains("отказ", StringComparison.OrdinalIgnoreCase)
        || ex.Message.Contains("Unauthorized", StringComparison.OrdinalIgnoreCase)
        || ex.Message.Contains("EPERM", StringComparison.OrdinalIgnoreCase)
        || ex.Message.Contains("EACCES", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Elevate: PowerShell -File install script with UAC (runas).
    /// Windows-only path for 2.0.
    /// </summary>
    private void WriteHostsElevated(string content)
    {
        string tmp = Path.GetTempPath();
        string contentPath = Path.Combine(tmp, $"spf_hosts_prepared_{Guid.NewGuid():N}.txt");
        string scriptPath = Path.Combine(tmp, $"spf_hosts_install_{Guid.NewGuid():N}.ps1");

        try
        {
            File.WriteAllText(contentPath, content, new UTF8Encoding(false));
            // Script copies prepared content onto system hosts (braces escaped for PS, not C# interp)
            string hp = PsQuote(_hostsPath);
            string cf = PsQuote(contentPath);
            string script =
                "$ErrorActionPreference = \"Stop\"\r\n" +
                "$hostsPath = " + hp + "\r\n" +
                "$contentFile = " + cf + "\r\n" +
                "if (-not (Test-Path -LiteralPath $hostsPath)) { throw \"System hosts not found: $hostsPath\" }\r\n" +
                "if (-not (Test-Path -LiteralPath $contentFile)) { throw \"Prepared hosts not found: $contentFile\" }\r\n" +
                "Copy-Item -LiteralPath $contentFile -Destination $hostsPath -Force\r\n" +
                "try { ipconfig /flushdns | Out-Null } catch {}\r\n" +
                "Write-Output \"OK\"\r\n";
            File.WriteAllText(scriptPath, script, new UTF8Encoding(false));

            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-ExecutionPolicy Bypass -NoProfile -File \"{scriptPath}\"",
                UseShellExecute = true,
                Verb = "runas",
                WindowStyle = ProcessWindowStyle.Hidden,
            };

            Process? proc;
            try
            {
                proc = Process.Start(psi);
            }
            catch (System.ComponentModel.Win32Exception)
            {
                // User cancelled UAC consent
                throw new InvalidOperationException("Операция отменена в окне UAC.");
            }

            if (proc is null)
                throw new InvalidOperationException("Не удалось запустить elevated PowerShell (UAC отменён?).");

            using (proc)
            {
                if (!proc.WaitForExit(120_000))
                {
                    try { proc.Kill(entireProcessTree: true); } catch { /* ignore */ }
                    throw new InvalidOperationException("Таймаут elevated-записи hosts (120 с).");
                }

                int code;
                try { code = proc.ExitCode; }
                catch { code = -1; }

                if (code != 0)
                    throw new InvalidOperationException(
                        $"Elevated write failed (exit {code}). Отменено в UAC или нет прав.");
            }

            // Confirm write actually landed (content we prepared is still on disk as source of truth)
            try
            {
                if (File.Exists(contentPath) && File.Exists(_hostsPath))
                {
                    // Best-effort: if prepared content had managed block, hosts should too after apply
                    string prepared = File.ReadAllText(contentPath);
                    string after = File.ReadAllText(_hostsPath);
                    if (prepared.Contains(HostsBlock.StartMarker, StringComparison.Ordinal)
                        && !after.Contains(HostsBlock.StartMarker, StringComparison.Ordinal))
                        throw new IOException("После elevated-записи блок hosts не найден — запись не удалась.");
                }
            }
            catch (IOException) { throw; }
            catch { /* ignore transient read issues */ }
        }
        finally
        {
            try { File.Delete(contentPath); } catch { /* ignore */ }
            try { File.Delete(scriptPath); } catch { /* ignore */ }
        }
    }

    private static string PsQuote(string path) =>
        "'" + path.Replace("'", "''") + "'";

    private static void FlushDns()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "ipconfig",
                Arguments = "/flushdns",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };
            using var p = Process.Start(psi);
            p?.WaitForExit(10_000);
        }
        catch { /* ignore */ }
    }

    /// <summary>Resolve domain via system resolver (reads hosts) and compare to expected IP.</summary>
    public static bool VerifyRedirect(string domain, string expectedIp)
    {
        try
        {
            var addrs = Dns.GetHostAddresses(domain);
            return addrs.Any(a =>
                a.AddressFamily == AddressFamily.InterNetwork
                && a.ToString().Equals(expectedIp, StringComparison.Ordinal));
        }
        catch
        {
            return false;
        }
    }
}
