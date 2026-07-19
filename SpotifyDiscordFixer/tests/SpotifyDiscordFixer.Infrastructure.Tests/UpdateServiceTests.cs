using FluentAssertions;
using SpotifyDiscordFixer.Infrastructure.Services;

namespace SpotifyDiscordFixer.Infrastructure.Tests;

public class UpdateServiceTests
{
    [Theory]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer/releases/tag/v2.0.0", "v2.0.0")]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.0.1/x.exe", "v2.0.1")]
    [InlineData("tag:github.com,2008:Repository/1294332732/v2.0.0", "v2.0.0")]
    [InlineData("2.0.0", "2.0.0")]
    public void TryExtractTag_ok(string text, string expected)
    {
        UpdateService.TryExtractTag(text, out var tag).Should().BeTrue();
        tag.Should().Be(expected);
    }

    [Fact]
    public void TryParseLatestTagFromAtom_reads_first_entry()
    {
        const string xml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <feed xmlns="http://www.w3.org/2005/Atom">
              <title>releases</title>
              <entry>
                <id>tag:github.com,2008:Repository/1294332732/v2.1.0</id>
                <link rel="alternate" type="text/html" href="https://github.com/swd3k/spotify-discord-fixer/releases/tag/v2.1.0"/>
                <title>Spotify Discord Fixer v2.1.0</title>
              </entry>
              <entry>
                <id>tag:github.com,2008:Repository/1294332732/v2.0.0</id>
                <title>Spotify Discord Fixer v2.0.0</title>
              </entry>
            </feed>
            """;

        UpdateService.TryParseLatestTagFromAtom(xml, out var tag).Should().BeTrue();
        tag.Should().Be("v2.1.0");
    }

    [Fact]
    public void BuildSetupDownloadUrl_canonical()
    {
        UpdateService.BuildSetupDownloadUrl("2.0.1", "win-x64")
            .Should().Be(
                "https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.0.1/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe");
        UpdateService.BuildSetupAssetName("v2.0.1", "win-arm64")
            .Should().Be("Spotify-Discord-Fixer-Setup-2.0.1-win-arm64.exe");
        UpdateService.BuildSetupDownloadUrl("v2.1.0", "win-x86")
            .Should().Be(
                "https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.1.0/Spotify-Discord-Fixer-Setup-2.1.0-win-x86.exe");
    }

    [Theory]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.0.1/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe", true)]
    [InlineData("https://objects.githubusercontent.com/github-production-release-asset-2e65be/1/x", true)]
    [InlineData("https://release-assets.githubusercontent.com/github-production-release-asset/1", true)]
    [InlineData("https://raw.githubusercontent.com/swd3k/spotify-discord-fixer/main/evil.exe", false)]
    [InlineData("https://evil.githubusercontent.com/payload", false)]
    [InlineData("https://github.com/evil/repo/releases/download/v1/x.exe", false)]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer/archive/refs/heads/main.zip", false)]
    [InlineData("http://github.com/swd3k/spotify-discord-fixer/releases/download/v1/x.exe", false)]
    [InlineData("file:///C:/Windows/System32/calc.exe", false)]
    [InlineData("https://github.com/swd3k/antilag-next/releases/download/v1/x.exe", false)]
    public void IsAllowedDownloadUrl_policy(string url, bool ok)
    {
        UpdateService.IsAllowedDownloadUrl(url).Should().Be(ok);
    }

    [Theory]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer/releases/latest", true)]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer/releases/tag/v2.0.1", true)]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer/releases", true)]
    [InlineData("https://github.com/swd3k/spotify-discord-fixer", true)]
    [InlineData("https://github.com/swd3k/other/releases", false)]
    [InlineData("https://evil.com/swd3k/spotify-discord-fixer/releases", false)]
    [InlineData("file:///C:/temp/x", false)]
    [InlineData("javascript:alert(1)", false)]
    public void IsAllowedReleasePageUrl_policy(string url, bool ok)
    {
        UpdateService.IsAllowedReleasePageUrl(url).Should().Be(ok);
    }

    [Fact]
    public void LooksLikePeExecutable_rejects_text()
    {
        string path = Path.Combine(Path.GetTempPath(), "sdf-pe-test-" + Guid.NewGuid().ToString("N") + ".exe");
        try
        {
            File.WriteAllText(path, "not a pe");
            UpdateService.LooksLikePeExecutable(path).Should().BeFalse();
        }
        finally
        {
            try { File.Delete(path); } catch { /* ignore */ }
        }
    }

    [Fact]
    public void LooksLikePeExecutable_accepts_minimal_mz_pe()
    {
        string path = Path.Combine(Path.GetTempPath(), "sdf-pe-ok-" + Guid.NewGuid().ToString("N") + ".exe");
        try
        {
            // Minimal stub: MZ + e_lfanew → PE\0\0
            var bytes = new byte[0x80];
            bytes[0] = (byte)'M';
            bytes[1] = (byte)'Z';
            BitConverter.GetBytes(0x40).CopyTo(bytes, 0x3C);
            bytes[0x40] = (byte)'P';
            bytes[0x41] = (byte)'E';
            bytes[0x42] = 0;
            bytes[0x43] = 0;
            File.WriteAllBytes(path, bytes);
            UpdateService.LooksLikePeExecutable(path).Should().BeTrue();
        }
        finally
        {
            try { File.Delete(path); } catch { /* ignore */ }
        }
    }

    [Fact]
    public void ClassifyError_never_uses_raw_russian_socket_text()
    {
        var (code, msg) = UpdateService.ClassifyError(
            new HttpRequestException("Попытка установить соединение была безуспешной",
                new System.Net.Sockets.SocketException(10060)));
        code.Should().Be(UpdateService.ErrorCodes.Network);
        msg.Should().NotContain("Попытка");
        msg.Should().Contain("GitHub");

        var (c2, m2) = UpdateService.ClassifyError(new TimeoutException());
        c2.Should().Be(UpdateService.ErrorCodes.Timeout);
        m2.Should().Contain("timed out");

        var (c3, m3) = UpdateService.ClassifyError(new InvalidOperationException("boom"));
        c3.Should().Be(UpdateService.ErrorCodes.Network);
        m3.Should().Contain("GitHub");
    }

    [Fact]
    public void GetCurrentRid_is_windows_rid()
    {
        string rid = UpdateService.GetCurrentRid();
        rid.Should().BeOneOf("win-x64", "win-x86", "win-arm64");
    }

    [Fact]
    public void LocalVersion_is_readable()
    {
        var svc = new UpdateService();
        svc.LocalVersion.Should().NotBeNullOrWhiteSpace();
        SpotifyDiscordFixer.Core.Models.SemVer.TryParse(svc.LocalVersion, out _).Should().BeTrue();
    }
}
