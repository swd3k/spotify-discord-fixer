using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace SpotifyDiscordFixer.Ui.Services;

internal sealed class TrayService : IDisposable
{
    private NotifyIcon? _tray;
    private Icon? _iconOwned;
    private bool _disposed;

    public event Action? ShowRequested;
    public event Action? ExitRequested;

    public void Init()
    {
        if (_tray != null) return;
        try
        {
            _iconOwned = LoadIcon();
            _tray = new NotifyIcon
            {
                Icon = _iconOwned ?? SystemIcons.Application,
                Text = "Spotify Discord Fixer",
                Visible = true,
            };
            _tray.DoubleClick += (_, _) => ShowRequested?.Invoke();
            RebuildMenu();
        }
        catch { /* tray best-effort */ }
    }

    public void RebuildMenu()
    {
        if (_tray == null) return;
        var menu = new ContextMenuStrip();
        menu.Items.Add("Открыть", null, (_, _) => ShowRequested?.Invoke());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Выход", null, (_, _) => ExitRequested?.Invoke());
        _tray.ContextMenuStrip = menu;
    }

    public void ShowBalloon(string title, string text, int ms = 2800)
    {
        try
        {
            if (_tray == null) return;
            _tray.BalloonTipTitle = title.Length > 63 ? title[..63] : title;
            _tray.BalloonTipText = text.Length > 255 ? text[..255] : text;
            _tray.ShowBalloonTip(ms);
        }
        catch { /* ignore */ }
    }

    public static void HideWindow(IntPtr hwnd)
    {
        if (hwnd != IntPtr.Zero) ShowWindow(hwnd, 0);
    }

    public static void ShowWindowRestore(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) return;
        ShowWindow(hwnd, 9);
        ShowWindow(hwnd, 5);
        SetForegroundWindow(hwnd);
    }

    private static Icon? LoadIcon()
    {
        try
        {
            string ico = Path.Combine(AppContext.BaseDirectory, "Assets", "app.ico");
            if (File.Exists(ico)) return new Icon(ico);
            string png = Path.Combine(AppContext.BaseDirectory, "Assets", "tray.png");
            if (File.Exists(png))
            {
                using var bmp = new Bitmap(png);
                using var scaled = new Bitmap(bmp, new Size(32, 32));
                IntPtr h = scaled.GetHicon();
                return Icon.FromHandle(h);
            }
        }
        catch { /* ignore */ }
        return null;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        try
        {
            if (_tray != null)
            {
                _tray.Visible = false;
                _tray.Dispose();
            }
        }
        catch { /* ignore */ }
        try { _iconOwned?.Dispose(); } catch { /* ignore */ }
    }

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);
}
