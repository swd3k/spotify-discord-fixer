using System.Diagnostics;
using System.Text.Json;
using Photino.NET;
using SpotifyDiscordFixer.Core.Hosts;
using SpotifyDiscordFixer.Core.Models;
using SpotifyDiscordFixer.Infrastructure.Services;
using SpotifyDiscordFixer.Infrastructure.Storage;
using SpotifyDiscordFixer.Ui.Services;

namespace SpotifyDiscordFixer.Ui;

internal static class Program
{
    private static PhotinoWindow? _window;
    private static TrayService? _tray;
    private static SingleInstance? _singleInstance;
    private static HostsService? _hosts;
    private static GeoHideProbeService? _probe;
    private static UpdateService? _update;
    private static UpdateCheckResult? _lastUpdateCheck;
    private static long _lastBackgroundUpdateCheckTicks;
    private static volatile bool _forceExit;
    private static volatile bool _startHidden;
    private static int _heavyOp;
    private static int _trayBalloonShown; // 0/1 process-local

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    [STAThread]
    private static void Main(string[] args)
    {
        _startHidden = args.Any(a => a.Equals("--hidden", StringComparison.OrdinalIgnoreCase));

        AppPaths.EnsureDirectories();
        _hosts = new HostsService();
        _hosts.SetBackupDirectory(AppPaths.DefaultDownloadsDir());
        _probe = new GeoHideProbeService();
        _update = new UpdateService();

        _singleInstance = SingleInstance.TryEnter(BringToFront);
        if (_singleInstance is null)
        {
            SingleInstance.ActivateExisting();
            return;
        }

        try
        {
            string www = Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html");
            if (!File.Exists(www))
                www = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "wwwroot", "index.html"));

            var window = new PhotinoWindow();
            _window = window;

            string? iconPath = Path.Combine(AppContext.BaseDirectory, "Assets", "app.ico");
            if (File.Exists(iconPath))
                window.SetIconFile(iconPath);

            window
                .SetTitle(SingleInstance.WindowTitle)
                .SetUseOsDefaultSize(false)
                .SetSize(new System.Drawing.Size(1060, 740))
                .SetMinSize(720, 560)
                .Center()
                .SetResizable(true)
                .SetMinimized(_startHidden)
                .RegisterWebMessageReceivedHandler(OnWebMessage)
                .RegisterWindowClosingHandler(OnWindowClosing)
                .RegisterWindowCreatedHandler((_, _) =>
                {
                    try
                    {
                        if (_startHidden)
                        {
                            IntPtr hwnd = window.WindowHandle;
                            if (hwnd != IntPtr.Zero)
                                TrayService.HideWindow(hwnd);
                        }
                    }
                    catch { /* ignore */ }

                    ScheduleBackgroundUpdateCheck(initialDelayMs: 4000);
                })
                .Load(new Uri(www, UriKind.Absolute));

            InitTray();
            window.WaitForClose();
        }
        finally
        {
            try { _tray?.Dispose(); } catch { /* ignore */ }
            try { _singleInstance?.Dispose(); } catch { /* ignore */ }
        }
    }

    private static bool OnWindowClosing(object sender, EventArgs e)
    {
        if (_forceExit) return false;
        HideToTray(showBalloon: true);
        return true; // cancel close → tray
    }

    private static void InitTray()
    {
        try
        {
            _tray = new TrayService();
            _tray.Init();
            _tray.ShowRequested += ShowFromTray;
            _tray.ExitRequested += RequestExit;
        }
        catch { /* ignore */ }
    }

    private static void HideToTray(bool showBalloon)
    {
        try
        {
            var w = _window;
            if (w == null) return;
            IntPtr hwnd = w.WindowHandle;
            if (hwnd != IntPtr.Zero)
                TrayService.HideWindow(hwnd);
            else
                w.SetMinimized(true);
            // One balloon per process; UI also shows a one-shot toast via localStorage
            if (showBalloon && Interlocked.CompareExchange(ref _trayBalloonShown, 1, 0) == 0)
            {
                _tray?.ShowBalloon("Spotify Discord Fixer",
                    "Свёрнуто в трей. Двойной клик — открыть. Выход — из меню трея.");
            }
            try
            {
                ReplyBroadcast(new { eventName = "trayMinimized" });
            }
            catch { /* ignore */ }
        }
        catch { /* ignore */ }
    }

    private static void ShowFromTray()
    {
        try
        {
            var w = _window;
            if (w == null) return;
            void restore()
            {
                w.SetMinimized(false);
                IntPtr hwnd = w.WindowHandle;
                if (hwnd != IntPtr.Zero)
                    TrayService.ShowWindowRestore(hwnd);
            }
            try { w.Invoke(restore); } catch { restore(); }
        }
        catch { /* ignore */ }
    }

    private static void BringToFront()
    {
        try
        {
            if (_window == null)
            {
                SingleInstance.TryFocusWindowByTitle();
                return;
            }
            ShowFromTray();
        }
        catch { /* ignore */ }
    }

    private static void RequestExit()
    {
        _forceExit = true;
        try
        {
            var w = _window;
            if (w == null) { Environment.Exit(0); return; }
            try { w.Invoke(() => { try { w.Close(); } catch { /* ignore */ } }); }
            catch { try { w.Close(); } catch { /* ignore */ } }
        }
        catch { Environment.Exit(0); }

        _ = Task.Run(async () =>
        {
            await Task.Delay(1500).ConfigureAwait(false);
            if (_forceExit) Environment.Exit(0);
        });
    }

    private static void OnWebMessage(object? sender, string message)
    {
        string? id = null;
        try
        {
            using var doc = JsonDocument.Parse(message);
            var root = doc.RootElement;
            id = root.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
            string? cmd = root.TryGetProperty("cmd", out var c) ? c.GetString() : null;
            if (string.IsNullOrEmpty(cmd))
            {
                Reply(id, new { error = "нет команды" });
                return;
            }

            // Heavy / network ops off message thread
            if (cmd is "getIps" or "apply" or "remove" or "pingIp" or "checkUpdate" or "startUpdate")
            {
                QueueAsync(id, cmd, root);
                return;
            }

            object? payload = cmd switch
            {
                "getStatus" => new { status = _hosts!.GetStatus() },
                "getActiveBlock" => MapBlock(_hosts!.GetActiveBlock()),
                "getHostsMeta" => new
                {
                    path = _hosts!.HostsPath,
                    elevated = _hosts.CanWriteHostsDirectly(),
                    backupDir = _hosts.ResolveBackupDir(),
                },
                "getBlockText" => new
                {
                    text = HostsBlock.BuildBlock(ReadIpList(root)),
                },
                "getAutostart" => new { enabled = StartupRegistration.IsEnabled() },
                "setAutostart" => HandleSetAutostart(root),
                "getState" => BuildState(),
                "openUrl" => HandleOpenUrl(root),
                "openReleases" => HandleOpenReleases(),
                "uiReady" => new { ok = true, version = _update?.LocalVersion ?? "2.0.0" },
                "hideToTray" => HandleHideToTray(),
                _ => new { error = "неизвестная команда", cmd },
            };
            Reply(id, payload);
        }
        catch (Exception ex)
        {
            Reply(id, new { error = "ошибка обработчика", detail = ex.Message });
        }
    }

    private static object HandleHideToTray()
    {
        HideToTray(showBalloon: false);
        return new { ok = true };
    }

    private static object HandleSetAutostart(JsonElement root)
    {
        bool enabled = root.TryGetProperty("enabled", out var e) && e.GetBoolean();
        StartupRegistration.SetEnabled(enabled);
        return new { enabled = StartupRegistration.IsEnabled() };
    }

    private static object HandleOpenUrl(JsonElement root)
    {
        string? url = root.TryGetProperty("url", out var u) ? u.GetString() : null;
        if (!string.IsNullOrWhiteSpace(url)
            && (url.StartsWith("https://github.com/", StringComparison.OrdinalIgnoreCase)
                || url.StartsWith("https://raw.githubusercontent.com/", StringComparison.OrdinalIgnoreCase)))
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true,
                });
            }
            catch { /* ignore */ }
        }
        return new { ok = true };
    }

    private static object HandleOpenReleases()
    {
        try
        {
            string url = _lastUpdateCheck?.ReleaseUrl ?? UpdateService.ReleasesPage;
            if (!UpdateService.IsAllowedReleasePageUrl(url))
                url = UpdateService.ReleasesPage;

            Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
            return new { success = true, url };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static void QueueAsync(string? id, string cmd, JsonElement root)
    {
        if (cmd is "apply" or "remove" or "startUpdate")
        {
            if (Interlocked.CompareExchange(ref _heavyOp, 1, 0) != 0)
            {
                Reply(id, new { success = false, busy = true, message = "Операция уже выполняется." });
                return;
            }
        }

        // Capture args before root disposed
        string? pingIp = null;
        List<string>? applyIps = null;
        if (cmd == "pingIp" && root.TryGetProperty("ip", out var ipEl))
            pingIp = ipEl.GetString();
        if (cmd == "apply")
            applyIps = ReadIpList(root).ToList();

        _ = Task.Run(async () =>
        {
            try
            {
                object payload = cmd switch
                {
                    "getIps" => HandleGetIps(),
                    "pingIp" => new { latency = await _probe!.PingIpAsync(pingIp ?? "").ConfigureAwait(false) },
                    "apply" => HandleApply(applyIps ?? new List<string>()),
                    "remove" => HandleRemove(),
                    "checkUpdate" => await HandleCheckUpdateAsync().ConfigureAwait(false),
                    "startUpdate" => await HandleStartUpdateAsync().ConfigureAwait(false),
                    _ => new { error = "неизвестная асинхронная команда" },
                };
                ReplyOnUi(id, payload);
            }
            catch (Exception ex)
            {
                if (cmd is "checkUpdate" or "startUpdate")
                {
                    var (code, msg) = UpdateService.ClassifyError(ex);
                    ReplyOnUi(id, new
                    {
                        success = false,
                        error = msg,
                        errorCode = code,
                        local = _update?.LocalVersion ?? "2.0.0",
                    });
                }
                else
                {
                    ReplyOnUi(id, new { success = false, error = ex.Message });
                }
            }
            finally
            {
                if (cmd is "apply" or "remove" or "startUpdate")
                    Interlocked.Exchange(ref _heavyOp, 0);
            }
        });
    }

    private static async Task<object> HandleCheckUpdateAsync()
    {
        var result = await _update!.CheckAsync().ConfigureAwait(false);
        _lastUpdateCheck = result;
        _lastBackgroundUpdateCheckTicks = Environment.TickCount64;

        object? state = null;
        try { state = BuildState(); }
        catch { /* ignore */ }

        if (!string.IsNullOrEmpty(result.Error) && !result.HasUpdate)
        {
            return new
            {
                success = false,
                hasUpdate = false,
                local = result.LocalVersion,
                latest = result.LatestVersion,
                canSilent = result.CanSilentInstall,
                portable = result.IsPortable,
                releaseUrl = result.ReleaseUrl,
                downloadUrl = result.DownloadUrl,
                error = result.Error,
                errorCode = result.ErrorCode,
                state,
            };
        }

        return new
        {
            success = true,
            hasUpdate = result.HasUpdate,
            local = result.LocalVersion,
            latest = result.LatestVersion,
            canSilent = result.CanSilentInstall,
            portable = result.IsPortable,
            releaseUrl = result.ReleaseUrl,
            downloadUrl = result.DownloadUrl,
            error = (string?)null,
            errorCode = (string?)null,
            state,
        };
    }

    private static async Task<object> HandleStartUpdateAsync()
    {
        var check = _lastUpdateCheck;
        if (check is null || !check.HasUpdate)
            check = await _update!.CheckAsync().ConfigureAwait(false);
        _lastUpdateCheck = check;

        if (!check.HasUpdate)
        {
            return new
            {
                success = true,
                hasUpdate = false,
                message = "Уже установлена актуальная версия",
                state = BuildState(),
            };
        }

        if (!check.CanSilentInstall)
        {
            return new
            {
                success = false,
                needsBrowser = true,
                releaseUrl = check.ReleaseUrl ?? UpdateService.ReleasesPage,
                message = "Тихая установка доступна только из Program Files. Откройте Releases и скачайте Setup.",
                state = BuildState(),
            };
        }

        var result = await _update!.DownloadAndInstallAsync(check).ConfigureAwait(false);
        if (!result.Success)
        {
            return new
            {
                success = false,
                error = result.Message,
                detail = result.Detail,
                releaseUrl = check.ReleaseUrl,
                state = BuildState(),
            };
        }

        // Exit so Inno can replace files
        _ = Task.Run(async () =>
        {
            await Task.Delay(500).ConfigureAwait(false);
            try { _forceExit = true; } catch { /* ignore */ }
            Environment.Exit(0);
        });

        return new { success = true, exiting = true, message = result.Message };
    }

    private static void ScheduleBackgroundUpdateCheck(int initialDelayMs)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(initialDelayMs).ConfigureAwait(false);
                await RunBackgroundUpdateCheckIfDueAsync(force: true).ConfigureAwait(false);

                // Re-check every 4 hours while app is running
                while (!_forceExit)
                {
                    await Task.Delay(TimeSpan.FromHours(4)).ConfigureAwait(false);
                    if (_forceExit) break;
                    await RunBackgroundUpdateCheckIfDueAsync(force: false).ConfigureAwait(false);
                }
            }
            catch { /* never crash host on background update */ }
        });
    }

    private static async Task RunBackgroundUpdateCheckIfDueAsync(bool force)
    {
        if (_update is null) return;
        long now = Environment.TickCount64;
        // Throttle: at most once per ~4 hours unless forced (first run)
        if (!force && _lastBackgroundUpdateCheckTicks != 0
            && now - _lastBackgroundUpdateCheckTicks < TimeSpan.FromHours(4).TotalMilliseconds)
            return;

        try
        {
            var result = await _update.CheckAsync().ConfigureAwait(false);
            _lastUpdateCheck = result;
            if (string.IsNullOrEmpty(result.Error))
                _lastBackgroundUpdateCheckTicks = Environment.TickCount64;

            // Notify UI so banner appears without waiting for manual check
            if (result.HasUpdate)
            {
                ReplyOnUi(null, new
                {
                    eventName = "updateAvailable",
                    update = MapUpdateState(result),
                });
            }
        }
        catch { /* ignore */ }
    }

    private static object HandleGetIps()
    {
        var records = _probe!.GetIpsAsync().GetAwaiter().GetResult();
        return new
        {
            success = true,
            ips = records.Select(r => new
            {
                ip = r.Ip,
                status = r.Status == IpStatus.Up ? "Up" : "Down",
                provider = r.Provider,
                latency = r.LatencyMs.HasValue ? Math.Round(r.LatencyMs.Value) : (double?)null,
            }).ToList(),
        };
    }

    private static object HandleApply(List<string> ips)
    {
        var r = _hosts!.Apply(ips);
        return new
        {
            success = r.Success,
            message = r.Message,
            status = _hosts.GetStatus(),
            activeBlock = MapBlock(_hosts.GetActiveBlock()),
        };
    }

    private static object HandleRemove()
    {
        var r = _hosts!.Remove();
        return new
        {
            success = r.Success,
            message = r.Message,
            status = _hosts.GetStatus(),
            activeBlock = (object?)null,
        };
    }

    private static object BuildState()
    {
        return new
        {
            version = _update?.LocalVersion ?? "2.0.0",
            appVersion = _update?.LocalVersion ?? "2.0.0",
            status = _hosts!.GetStatus(),
            activeBlock = MapBlock(_hosts.GetActiveBlock()),
            hostsPath = _hosts.HostsPath,
            elevated = _hosts.CanWriteHostsDirectly(),
            backupDir = _hosts.ResolveBackupDir(),
            autostart = StartupRegistration.IsEnabled(),
            busy = Volatile.Read(ref _heavyOp) != 0,
            update = MapUpdateState(_lastUpdateCheck),
        };
    }

    private static object? MapUpdateState(UpdateCheckResult? r)
    {
        if (r is null) return null;
        return new
        {
            hasUpdate = r.HasUpdate,
            local = r.LocalVersion,
            latest = r.LatestVersion,
            canSilent = r.CanSilentInstall,
            portable = r.IsPortable,
            releaseUrl = r.ReleaseUrl,
            error = string.IsNullOrEmpty(r.Error) && string.IsNullOrEmpty(r.ErrorCode)
                ? null
                : r.Error,
            errorCode = string.IsNullOrEmpty(r.ErrorCode) ? null : r.ErrorCode,
        };
    }

    private static object? MapBlock(ParsedBlock? b)
    {
        if (b is null) return null;
        return new { ip = b.Ip, domains = b.Domains, text = b.Text };
    }

    private static IEnumerable<string> ReadIpList(JsonElement root)
    {
        if (!root.TryGetProperty("ips", out var arr) || arr.ValueKind != JsonValueKind.Array)
        {
            if (root.TryGetProperty("ip", out var one) && one.ValueKind == JsonValueKind.String)
            {
                var s = one.GetString();
                if (!string.IsNullOrEmpty(s)) yield return s;
            }
            yield break;
        }
        foreach (var el in arr.EnumerateArray())
        {
            if (el.ValueKind == JsonValueKind.String)
            {
                var s = el.GetString();
                if (!string.IsNullOrEmpty(s)) yield return s!;
            }
        }
    }

    private static void Reply(string? id, object? payload)
    {
        try
        {
            var env = new { id, payload };
            string json = JsonSerializer.Serialize(env, JsonOpts);
            _window?.SendWebMessage(json);
        }
        catch { /* ignore */ }
    }

    private static void ReplyOnUi(string? id, object? payload)
    {
        var w = _window;
        if (w == null) { Reply(id, payload); return; }
        try
        {
            w.Invoke(() => Reply(id, payload));
        }
        catch
        {
            Reply(id, payload);
        }
    }

    private static void ReplyBroadcast(object? payload)
    {
        Reply(null, payload);
    }
}
