using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using SpotifyDiscordFixer.Core.Hosts;

namespace SpotifyDiscordFixer.Infrastructure.Services;

/// <summary>
/// Resolve geohide.ru + fallback IPs, TCP :443 latency probe.
/// Port of electron/hosts.ts getIps / pingIp.
/// </summary>
public sealed class GeoHideProbeService
{
    /// <summary>Fallback nodes when DNS fails (includes known GeoHide edge from product history).</summary>
    public static readonly string[] FallbackIps =
    {
        "37.230.192.51",
        "45.155.204.190",
        "185.162.248.51",
        "95.182.120.241",
    };

    public const string ResolveHost = "geohide.ru";
    public const int ProbePort = 443;
    public const int ProbeTimeoutMs = 3000;

    /// <summary>TCP connect latency in ms, or null if down/timeout/invalid.</summary>
    public async Task<double?> PingIpAsync(string ip, CancellationToken ct = default)
    {
        if (!HostsBlock.ValidateIp(ip)) return null;
        return await TcpPingAsync(ip, ProbePort, ProbeTimeoutMs, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<IpRecord>> GetIpsAsync(CancellationToken ct = default)
    {
        var resolved = new List<string>();
        try
        {
            var entries = await Dns.GetHostAddressesAsync(ResolveHost, ct).ConfigureAwait(false);
            foreach (var a in entries)
            {
                if (a.AddressFamily == AddressFamily.InterNetwork)
                {
                    string s = a.ToString();
                    if (HostsBlock.ValidateIp(s))
                        resolved.Add(s);
                }
            }
        }
        catch
        {
            // DNS fail → fallbacks only
        }

        var all = resolved
            .Concat(FallbackIps)
            .Where(HostsBlock.ValidateIp)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var resolvedSet = new HashSet<string>(resolved, StringComparer.Ordinal);
        var tasks = all.Select(async ip =>
        {
            var latency = await TcpPingAsync(ip, ProbePort, ProbeTimeoutMs, ct).ConfigureAwait(false);
            return new IpRecord(
                ip,
                latency is not null ? IpStatus.Up : IpStatus.Down,
                resolvedSet.Contains(ip) ? "GeoHide (geohide.ru)" : "GeoHide (резерв)",
                latency);
        });

        var records = (await Task.WhenAll(tasks).ConfigureAwait(false)).ToList();
        records.Sort((a, b) =>
        {
            if (a.Status != b.Status)
                return a.Status == IpStatus.Up ? -1 : 1;
            return (a.LatencyMs ?? double.PositiveInfinity)
                .CompareTo(b.LatencyMs ?? double.PositiveInfinity);
        });
        return records;
    }

    private static async Task<double?> TcpPingAsync(string ip, int port, int timeoutMs, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            using var client = new TcpClient();
            using var reg = ct.Register(() =>
            {
                try { client.Dispose(); } catch { /* ignore */ }
            });

            var connectTask = client.ConnectAsync(IPAddress.Parse(ip), port);
            var delayTask = Task.Delay(timeoutMs, ct);
            var done = await Task.WhenAny(connectTask, delayTask).ConfigureAwait(false);
            if (done != connectTask)
                return null;
            await connectTask.ConfigureAwait(false); // propagate connect errors
            if (!client.Connected) return null;
            sw.Stop();
            return sw.Elapsed.TotalMilliseconds;
        }
        catch
        {
            return null;
        }
    }
}
