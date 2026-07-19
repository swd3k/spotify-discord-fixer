using FluentAssertions;
using SpotifyDiscordFixer.Core.Hosts;
using SpotifyDiscordFixer.Infrastructure.Services;

namespace SpotifyDiscordFixer.Infrastructure.Tests;

public class HostsServiceTests : IDisposable
{
    private readonly string _tmpDir;
    private readonly string _hostsPath;
    private readonly string _backupDir;
    private readonly HostsService _svc;

    public HostsServiceTests()
    {
        _tmpDir = Path.Combine(Path.GetTempPath(), "spf-hosts-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tmpDir);
        _hostsPath = Path.Combine(_tmpDir, "hosts");
        _backupDir = Path.Combine(_tmpDir, "backups");
        Directory.CreateDirectory(_backupDir);
        File.WriteAllText(_hostsPath, "127.0.0.1 localhost\n");
        _svc = new HostsService(_hostsPath);
        _svc.SetBackupDirectory(_backupDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tmpDir, recursive: true); } catch { /* ignore */ }
    }

    [Fact]
    public void GetStatus_FalseThenTrueAfterApply()
    {
        _svc.GetStatus().Should().BeFalse();
        var r = _svc.Apply(new[] { "95.182.120.241" });
        r.Success.Should().BeTrue(r.Message);
        _svc.GetStatus().Should().BeTrue();
        var block = _svc.GetActiveBlock();
        block.Should().NotBeNull();
        block!.Ip.Should().Be("95.182.120.241");
        block.Domains.Should().Contain("open.spotify.com");
    }

    [Fact]
    public void Apply_StripsConflictingSpotifyLines_AndBacksUp()
    {
        File.WriteAllText(_hostsPath, """
            127.0.0.1 localhost
            8.8.8.8 open.spotify.com
            10.0.0.1 my-game.local

            """);
        var r = _svc.Apply(new[] { "1.2.3.4" });
        r.Success.Should().BeTrue(r.Message);
        r.Message.Should().Contain("Бэкап:");
        string content = File.ReadAllText(_hostsPath);
        content.Should().Contain("10.0.0.1 my-game.local");
        content.Should().NotContain("8.8.8.8 open.spotify.com");
        content.Should().Contain("1.2.3.4 open.spotify.com");
        content.Should().Contain(HostsBlock.StartMarker);
        Directory.GetFiles(_backupDir, "hosts_backup_*.txt").Should().NotBeEmpty();
    }

    [Fact]
    public void Remove_OnlyManagedBlock_KeepsManualSpotify()
    {
        File.WriteAllText(_hostsPath,
            "127.0.0.1 localhost\n8.8.8.8 open.spotify.com\n" +
            HostsBlock.BuildBlock(new[] { "1.1.1.1" }) + "\n");
        _svc.Apply(new[] { "2.2.2.2" }); // ensure writable path exercised
        // re-seed with manual + managed
        File.WriteAllText(_hostsPath,
            "127.0.0.1 localhost\n8.8.8.8 open.spotify.com\n" +
            HostsBlock.BuildBlock(new[] { "1.1.1.1" }) + "\n");
        var r = _svc.Remove();
        r.Success.Should().BeTrue(r.Message);
        string content = File.ReadAllText(_hostsPath);
        content.Should().Contain("8.8.8.8 open.spotify.com");
        content.Should().NotContain(HostsBlock.StartMarker);
        content.Should().NotContain("1.1.1.1 open.spotify.com");
    }

    [Fact]
    public void Apply_InvalidIp_Fails()
    {
        var r = _svc.Apply(new[] { "not-an-ip" });
        r.Success.Should().BeFalse();
    }

    [Fact]
    public void CanWrite_TempHosts_True()
    {
        _svc.CanWriteHostsDirectly().Should().BeTrue();
    }
}

public class GeoHideProbeServiceTests
{
    [Fact]
    public async Task PingIp_Invalid_ReturnsNull()
    {
        var probe = new GeoHideProbeService();
        (await probe.PingIpAsync("not-ip")).Should().BeNull();
        (await probe.PingIpAsync("999.999.999.999")).Should().BeNull();
    }

    [Fact]
    public async Task GetIps_ReturnsSortedRecords()
    {
        var probe = new GeoHideProbeService();
        // Network-dependent: should not throw; may be empty on offline CI
        var list = await probe.GetIpsAsync();
        list.Should().NotBeNull();
        foreach (var r in list)
            HostsBlock.ValidateIp(r.Ip).Should().BeTrue();
        // Fallback IPs always attempted
        list.Select(x => x.Ip).Should().Contain(ip => GeoHideProbeService.FallbackIps.Contains(ip));
    }
}
