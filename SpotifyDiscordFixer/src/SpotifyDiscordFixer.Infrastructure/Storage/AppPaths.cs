namespace SpotifyDiscordFixer.Infrastructure.Storage;

/// <summary>
/// App data under %APPDATA%\SpotifyDiscordFixer (or {exe}/data when portable marker present).
/// Hosts backups still go to Downloads (see HostsService) — same as Electron 1.1.0.
/// </summary>
public static class AppPaths
{
    public const string ProductFolder = "SpotifyDiscordFixer";
    public const string PortableMarker = "SpotifyDiscordFixer.portable";

    public static string AppDataRoot { get; } = ComputeAppDataRoot();
    public static string SettingsDirectory { get; } = Path.Combine(AppDataRoot, "settings");
    public static string SettingsFile { get; } = Path.Combine(SettingsDirectory, "user-settings.json");
    public static string LogsDirectory { get; } = Path.Combine(AppDataRoot, "logs");
    public static string WindowStateFile { get; } = Path.Combine(AppDataRoot, "window-state.json");
    public static string UpdaterLogFile { get; } = Path.Combine(AppDataRoot, "updater.log");

    public static void EnsureDirectories()
    {
        Directory.CreateDirectory(AppDataRoot);
        Directory.CreateDirectory(SettingsDirectory);
        Directory.CreateDirectory(LogsDirectory);
    }

    public static string DefaultDownloadsDir()
    {
        try
        {
            string downloads = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Downloads");
            if (Directory.Exists(downloads)) return downloads;
        }
        catch { /* fall through */ }

        return Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
    }

    private static string ComputeAppDataRoot()
    {
        string marker = Path.Combine(AppContext.BaseDirectory, PortableMarker);
        if (File.Exists(marker))
            return Path.Combine(AppContext.BaseDirectory, "data");
        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            ProductFolder);
    }
}
