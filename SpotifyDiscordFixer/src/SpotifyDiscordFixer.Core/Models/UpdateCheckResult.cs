namespace SpotifyDiscordFixer.Core.Models;

/// <summary>Result of checking GitHub Releases for a newer Setup.</summary>
public sealed class UpdateCheckResult
{
    public required string LocalVersion { get; init; }
    public string? LatestVersion { get; init; }
    public bool HasUpdate { get; init; }
    public string? DownloadUrl { get; init; }
    public string? ReleaseUrl { get; init; }
    public string? ReleaseNotes { get; init; }
    public string? AssetName { get; init; }
    public bool CanSilentInstall { get; init; }
    /// <summary>English fallback message (never OS-locale Win32 text).</summary>
    public string? Error { get; init; }
    /// <summary>Stable code for UI i18n: network, timeout, http, parse, unknown.</summary>
    public string? ErrorCode { get; init; }
    public bool IsPortable { get; init; }
}
