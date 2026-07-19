using FluentAssertions;
using SpotifyDiscordFixer.Core.Hosts;

namespace SpotifyDiscordFixer.Core.Tests;

public class HostsBlockTests
{
    [Fact]
    public void BuildBlock_UsesFirstValidIpOnly()
    {
        var block = HostsBlock.BuildBlock(new[] { "1.2.3.4", "5.6.7.8" });
        var lines = block.Split('\n');
        lines[0].Should().Be(HostsBlock.StartMarker);
        lines[^1].Should().Be(HostsBlock.EndMarker);
        lines.Should().HaveCount(HostsBlock.SpotifyDomains.Count + 2);
        block.Should().Contain("1.2.3.4 api.spotify.com");
        block.Should().NotContain("5.6.7.8");
    }

    [Fact]
    public void BuildBlock_SkipsInvalidTakesFirstValid()
    {
        var block = HostsBlock.BuildBlock(new[] { "not-an-ip", "evil; rm -rf /", "9.9.9.9" });
        block.Should().Contain("9.9.9.9 api.spotify.com");
        block.Should().NotContain("not-an-ip");
        block.Should().NotContain("evil");
    }

    [Fact]
    public void BuildBlock_EmptyWhenNoValidIp()
    {
        HostsBlock.BuildBlock(Array.Empty<string>())
            .Should().Be($"{HostsBlock.StartMarker}\n{HostsBlock.EndMarker}");
        HostsBlock.BuildBlock(new[] { "nope" })
            .Should().Be($"{HostsBlock.StartMarker}\n{HostsBlock.EndMarker}");
    }

    [Fact]
    public void ExtractBlock_NullWhenMissing()
    {
        HostsBlock.ExtractBlock("127.0.0.1 localhost\n").Should().BeNull();
    }

    [Fact]
    public void ExtractBlock_RoundTrip()
    {
        var block = HostsBlock.BuildBlock(new[] { "1.2.3.4" });
        var hosts = $"127.0.0.1 localhost\n\n{block}\n";
        var parsed = HostsBlock.ExtractBlock(hosts);
        parsed.Should().NotBeNull();
        parsed!.Ip.Should().Be("1.2.3.4");
        parsed.Domains.Should().Equal(HostsBlock.SpotifyDomains);
        parsed.Text.Should().Be(block);
    }

    [Fact]
    public void ExtractBlock_CrlfAndGarbageInside()
    {
        var hosts = $"# comment\r\n{HostsBlock.StartMarker}\r\n1.2.3.4 api.spotify.com\r\nне строка hosts\r\n{HostsBlock.EndMarker}\r\n";
        var parsed = HostsBlock.ExtractBlock(hosts);
        parsed!.Ip.Should().Be("1.2.3.4");
        parsed.Domains.Should().Equal("api.spotify.com");
    }

    [Fact]
    public void ExtractBlock_NoEndMarker()
    {
        var hosts = $"{HostsBlock.StartMarker}\n1.2.3.4 api.spotify.com\n";
        HostsBlock.ExtractBlock(hosts)!.Ip.Should().Be("1.2.3.4");
    }

    [Fact]
    public void PickBestIp_LowestLatencyUp()
    {
        var best = HostsBlock.PickBestIp(new[]
        {
            new IpRecord("1.1.1.1", IpStatus.Up, "t", 80),
            new IpRecord("2.2.2.2", IpStatus.Up, "t", 20),
            new IpRecord("3.3.3.3", IpStatus.Down, "t"),
        });
        best.Should().Be("2.2.2.2");
    }

    [Fact]
    public void PickBestIp_AllDown_Null()
    {
        HostsBlock.PickBestIp(new[]
        {
            new IpRecord("1.1.1.1", IpStatus.Down, "t"),
            new IpRecord("2.2.2.2", IpStatus.Down, "t"),
        }).Should().BeNull();
        HostsBlock.PickBestIp(Array.Empty<IpRecord>()).Should().BeNull();
    }

    [Fact]
    public void PickBestIp_MissingLatencyLoses()
    {
        var best = HostsBlock.PickBestIp(new[]
        {
            new IpRecord("1.1.1.1", IpStatus.Up, "t"),
            new IpRecord("2.2.2.2", IpStatus.Up, "t", 500),
        });
        best.Should().Be("2.2.2.2");
    }

    [Fact]
    public void SpotifyDomains_IncludesCdn()
    {
        HostsBlock.SpotifyDomains.Should().Contain("i.scdn.co");
        HostsBlock.SpotifyDomains.Should().Contain("spotifycdn.com");
    }

    [Fact]
    public void BackupFileName_Format()
    {
        var d = new DateTime(2026, 7, 15, 9, 5, 33);
        HostsBlock.FormatBackupStamp(d).Should().Be("2026-07-15_09-05");
        HostsBlock.BackupFileName(d).Should().Be("hosts_backup_2026-07-15_09-05.txt");
    }

    [Fact]
    public void NormalizeIpList_FiltersJunk()
    {
        HostsBlock.NormalizeIpList(new object?[] { "1.2.3.4", null, 5, new Dictionary<string, object?> { ["ip"] = "5.6.7.8" }, new Dictionary<string, object?> { ["ip"] = "bad" } })
            .Should().Equal("1.2.3.4", "5.6.7.8");
        HostsBlock.NormalizeIpList(new Dictionary<string, object?> { ["ip"] = "1.2.3.4" })
            .Should().BeEmpty();
        HostsBlock.NormalizeIpList("8.8.8.8").Should().Equal("8.8.8.8");
    }

    [Fact]
    public void LineConflicts_SpotifyDomains()
    {
        HostsBlock.LineConflictsWithSpotifyDomains("8.8.8.8 open.spotify.com").Should().BeTrue();
        HostsBlock.LineConflictsWithSpotifyDomains("1.1.1.1 api.spotify.com # note").Should().BeTrue();
        HostsBlock.LineConflictsWithSpotifyDomains("9.9.9.9 Open.Spotify.Com").Should().BeTrue();
        HostsBlock.LineConflictsWithSpotifyDomains("# 1.1.1.1 open.spotify.com").Should().BeFalse();
        HostsBlock.LineConflictsWithSpotifyDomains("127.0.0.1 localhost").Should().BeFalse();
        HostsBlock.LineConflictsWithSpotifyDomains("").Should().BeFalse();
    }

    [Fact]
    public void PrepareHosts_Apply_StripsConflictsAndRewritesBlock()
    {
        var oldBlock = HostsBlock.BuildBlock(new[] { "1.1.1.1" });
        var before = string.Join("\n", new[]
        {
            "127.0.0.1 localhost",
            "8.8.8.8 open.spotify.com",
            "9.9.9.9 api.spotify.com",
            "10.0.0.1 my-game.local",
            oldBlock,
            "",
        });
        var newBlock = HostsBlock.BuildBlock(new[] { "95.182.120.241" });
        var r = HostsBlock.PrepareHostsContent(before, HostsAction.Apply, newBlock);
        r.RemovedManagedBlock.Should().BeTrue();
        r.StrippedConflicts.Should().Be(2);
        r.Content.Should().Contain("127.0.0.1 localhost");
        r.Content.Should().Contain("10.0.0.1 my-game.local");
        r.Content.Should().NotContain("8.8.8.8 open.spotify.com");
        r.Content.Should().Contain("95.182.120.241 open.spotify.com");
        var openLines = r.Content.Split('\n')
            .Where(l => l.Contains("open.spotify.com", StringComparison.OrdinalIgnoreCase) && !l.TrimStart().StartsWith('#'))
            .ToList();
        openLines.Should().HaveCount(1);
        openLines[0].Should().StartWith("95.182.120.241");
    }

    [Fact]
    public void PrepareHosts_Remove_OnlyManagedBlock()
    {
        var block = HostsBlock.BuildBlock(new[] { "1.1.1.1" });
        var before = $"127.0.0.1 localhost\n8.8.8.8 open.spotify.com\n{block}\n";
        var r = HostsBlock.PrepareHostsContent(before, HostsAction.Remove);
        r.RemovedManagedBlock.Should().BeTrue();
        r.StrippedConflicts.Should().Be(0);
        r.Content.Should().Contain("8.8.8.8 open.spotify.com");
        r.Content.Should().NotContain(HostsBlock.StartMarker);
        r.Content.Should().NotContain("1.1.1.1 open.spotify.com");
    }

    [Theory]
    [InlineData("0.0.0.0", true)]
    [InlineData("127.0.0.1", true)]
    [InlineData("255.255.255.255", true)]
    [InlineData("37.230.192.51", true)]
    [InlineData("999.999.999.999", false)]
    [InlineData("256.0.0.1", false)]
    [InlineData("1.2.3.256", false)]
    [InlineData("not-an-ip", false)]
    [InlineData("", false)]
    [InlineData("1.2.3", false)]
    public void ValidateIp(string? ip, bool ok) =>
        HostsBlock.ValidateIp(ip).Should().Be(ok);
}
