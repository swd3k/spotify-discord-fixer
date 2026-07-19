using System.Text.RegularExpressions;

namespace SpotifyDiscordFixer.Core.Hosts;

/// <summary>
/// Pure hosts-block logic ported from shared/hostsBlock.ts (Electron 1.x).
/// No I/O — safe for unit tests.
/// </summary>
public static class HostsBlock
{
    public const string StartMarker = "#spotify-discord-hosts";
    public const string EndMarker = "#end-spotify-discord-hosts";

    /// <summary>Spotify domains redirected via hosts (including CDN — presence stability).</summary>
    public static readonly IReadOnlyList<string> SpotifyDomains = new[]
    {
        "api.spotify.com",
        "login5.spotify.com",
        "encore.scdn.co",
        "i.scdn.co",
        "gew1-spclient.spotify.com",
        "spclient.wg.spotify.com",
        "api-partner.spotify.com",
        "aet.spotify.com",
        "www.spotify.com",
        "accounts.spotify.com",
        "open.spotify.com",
        "accounts.scdn.co",
        "gew1-dealer.spotify.com",
        "open-exp.spotifycdn.com",
        "spotifycdn.com",
        "www-growth.scdn.co",
    };

    private static readonly Regex Ipv4Strict = new(
        @"^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex HostsLineIpHost = new(
        @"^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(\S+)",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static HashSet<string> DomainSet() =>
        new(SpotifyDomains.Select(d => d.ToLowerInvariant()), StringComparer.OrdinalIgnoreCase);

    public static bool ValidateIp(string? ip) =>
        !string.IsNullOrEmpty(ip) && Ipv4Strict.IsMatch(ip);

    /// <summary>Backup stamp: YYYY-MM-DD_HH-mm (no seconds).</summary>
    public static string FormatBackupStamp(DateTime? d = null)
    {
        var t = d ?? DateTime.Now;
        return $"{t:yyyy-MM-dd}_{t:HH-mm}";
    }

    public static string BackupFileName(DateTime? d = null) =>
        $"hosts_backup_{FormatBackupStamp(d)}.txt";

    /// <summary>
    /// Normalize unknown IPC/list input to valid IPv4 strings only.
    /// Accepts string, string[], or objects with string property "ip" (via dictionary).
    /// </summary>
    public static IReadOnlyList<string> NormalizeIpList(object? ips)
    {
        if (ips is null) return Array.Empty<string>();
        if (ips is string s)
            return ValidateIp(s) ? new[] { s } : Array.Empty<string>();

        if (ips is IEnumerable<string> strEnum)
        {
            var list = new List<string>();
            foreach (var item in strEnum)
                if (ValidateIp(item)) list.Add(item);
            return list;
        }

        if (ips is System.Collections.IEnumerable raw && ips is not string)
        {
            var list = new List<string>();
            foreach (var item in raw)
            {
                if (item is string ss && ValidateIp(ss))
                    list.Add(ss);
                else if (item is IDictionary<string, object?> dict
                         && dict.TryGetValue("ip", out var nested)
                         && nested is string ns
                         && ValidateIp(ns))
                    list.Add(ns);
                else if (item is IDictionary<string, string> dict2
                         && dict2.TryGetValue("ip", out var ns2)
                         && ValidateIp(ns2))
                    list.Add(ns2);
            }
            return list;
        }

        return Array.Empty<string>();
    }

    public static string? PickBestIp(IEnumerable<IpRecord> records)
    {
        var up = records
            .Where(r => r.Status == IpStatus.Up && ValidateIp(r.Ip))
            .OrderBy(r => r.LatencyMs ?? double.PositiveInfinity)
            .ToList();
        return up.Count == 0 ? null : up[0].Ip;
    }

    /// <summary>Build managed block for the first valid IP in the list.</summary>
    public static string BuildBlock(IEnumerable<string> ips)
    {
        string? ip = ips.FirstOrDefault(ValidateIp);
        var lines = new List<string> { StartMarker };
        if (ip is not null)
        {
            foreach (var domain in SpotifyDomains)
                lines.Add($"{ip} {domain}");
        }
        lines.Add(EndMarker);
        return string.Join("\n", lines);
    }

    public static ParsedBlock? ExtractBlock(string hostsContent)
    {
        var lines = hostsContent.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);
        int start = Array.FindIndex(lines, l => l.Contains(StartMarker, StringComparison.Ordinal));
        if (start < 0) return null;
        int end = -1;
        for (int i = start + 1; i < lines.Length; i++)
        {
            if (lines[i].Contains(EndMarker, StringComparison.Ordinal))
            {
                end = i;
                break;
            }
        }

        var body = end < 0
            ? lines.Skip(start + 1).ToArray()
            : lines.Skip(start + 1).Take(end - start - 1).ToArray();

        string? ip = null;
        var domains = new List<string>();
        foreach (var line in body)
        {
            var m = HostsLineIpHost.Match(line.Trim());
            if (!m.Success) continue;
            if (ip is null) ip = m.Groups[1].Value;
            domains.Add(m.Groups[2].Value);
        }

        var text = string.Join("\n", new[] { StartMarker }.Concat(body).Append(EndMarker));
        return new ParsedBlock(ip, domains, text);
    }

    public static bool LineConflictsWithSpotifyDomains(string line, ISet<string>? domains = null)
    {
        domains ??= DomainSet();
        var trimmed = line.Trim();
        if (trimmed.Length == 0 || trimmed.StartsWith('#')) return false;
        var code = trimmed.Split('#')[0].Trim();
        if (code.Length == 0) return false;
        var parts = code.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2) return false;
        for (int i = 1; i < parts.Length; i++)
        {
            if (domains.Contains(parts[i].ToLowerInvariant()))
                return true;
        }
        return false;
    }

    public static PrepareHostsResult PrepareHostsContent(
        string hostsContent,
        HostsAction action,
        string block = "")
    {
        var domains = DomainSet();
        var lines = hostsContent.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);
        var output = new List<string>();
        bool skip = false;
        bool removedManagedBlock = false;
        int strippedConflicts = 0;

        foreach (var line in lines)
        {
            if (line.Contains(StartMarker, StringComparison.Ordinal))
            {
                skip = true;
                removedManagedBlock = true;
                continue;
            }
            if (line.Contains(EndMarker, StringComparison.Ordinal))
            {
                skip = false;
                continue;
            }
            if (skip) continue;

            if (action == HostsAction.Apply && LineConflictsWithSpotifyDomains(line, domains))
            {
                strippedConflicts++;
                continue;
            }
            output.Add(line);
        }

        while (output.Count > 0 && string.IsNullOrWhiteSpace(output[^1]))
            output.RemoveAt(output.Count - 1);

        if (action == HostsAction.Apply && !string.IsNullOrWhiteSpace(block))
        {
            output.Add("");
            output.AddRange(block.TrimEnd().Split(new[] { "\r\n", "\n" }, StringSplitOptions.None));
        }

        var content = string.Join("\n", output).TrimEnd('\n', '\r') + "\n";
        return new PrepareHostsResult(content, strippedConflicts, removedManagedBlock);
    }
}

public enum HostsAction
{
    Apply,
    Remove
}

public enum IpStatus
{
    Up,
    Down
}

public sealed record IpRecord(string Ip, IpStatus Status, string Provider, double? LatencyMs = null);

public sealed record ParsedBlock(string? Ip, IReadOnlyList<string> Domains, string Text);

public sealed record PrepareHostsResult(string Content, int StrippedConflicts, bool RemovedManagedBlock);
