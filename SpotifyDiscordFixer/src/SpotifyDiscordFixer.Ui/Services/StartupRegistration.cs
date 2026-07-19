using Microsoft.Win32;

namespace SpotifyDiscordFixer.Ui.Services;

/// <summary>HKCU Run key — launch with --hidden for tray autostart.</summary>
internal static class StartupRegistration
{
    private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string ValueName = "SpotifyDiscordFixer";

    public static bool IsEnabled()
    {
        try
        {
            using var k = Registry.CurrentUser.OpenSubKey(RunKey, false);
            return k?.GetValue(ValueName) is string s && !string.IsNullOrWhiteSpace(s);
        }
        catch { return false; }
    }

    public static void SetEnabled(bool enabled)
    {
        using var k = Registry.CurrentUser.CreateSubKey(RunKey);
        if (enabled)
        {
            string exe = Environment.ProcessPath
                         ?? Path.Combine(AppContext.BaseDirectory, "SpotifyDiscordFixer.exe");
            k.SetValue(ValueName, $"\"{exe}\" --hidden");
        }
        else
        {
            try { k.DeleteValue(ValueName, throwOnMissingValue: false); } catch { /* ignore */ }
        }
    }
}
