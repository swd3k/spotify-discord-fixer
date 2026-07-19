using System.Diagnostics;
using System.Runtime.InteropServices;

namespace SpotifyDiscordFixer.Ui.Services;

/// <summary>One Photino UI process; second launch focuses the first (incl. tray).</summary>
internal sealed class SingleInstance : IDisposable
{
    public const string MutexName = @"Local\SpotifyDiscordFixer.Ui.SingleInstance.v1";
    public const string ShowEventName = @"Local\SpotifyDiscordFixer.Ui.ShowExisting.v1";
    public const string WindowTitle = "Spotify Discord Fixer";

    private readonly Mutex _mutex;
    private readonly EventWaitHandle _showEvent;
    private readonly CancellationTokenSource _cts = new();
    private readonly Thread _listener;
    private readonly Action _onShowRequested;
    private bool _owned;

    private SingleInstance(Mutex mutex, EventWaitHandle showEvent, Action onShowRequested)
    {
        _mutex = mutex;
        _showEvent = showEvent;
        _onShowRequested = onShowRequested;
        _owned = true;
        _listener = new Thread(ListenForShowRequests)
        {
            IsBackground = true,
            Name = "SDF-SingleInstance"
        };
        _listener.Start();
    }

    public static SingleInstance? TryEnter(Action onShowRequested)
    {
        Mutex? mutex = null;
        try
        {
            mutex = new Mutex(initiallyOwned: false, MutexName, out _);
            bool owns;
            try { owns = mutex.WaitOne(TimeSpan.Zero); }
            catch (AbandonedMutexException)
            {
                owns = true;
                Trace.TraceWarning("SingleInstance: recovered abandoned mutex.");
            }
            if (!owns)
            {
                try { mutex.Dispose(); } catch { /* ignore */ }
                return null;
            }
            var showEvent = new EventWaitHandle(false, EventResetMode.AutoReset, ShowEventName);
            return new SingleInstance(mutex, showEvent, onShowRequested);
        }
        catch
        {
            try { mutex?.Dispose(); } catch { /* ignore */ }
            throw;
        }
    }

    public static void ActivateExisting()
    {
        try
        {
            using var ev = EventWaitHandle.OpenExisting(ShowEventName);
            ev.Set();
        }
        catch { /* ignore */ }

        for (int i = 0; i < 15; i++)
        {
            if (TryFocusWindowByTitle()) return;
            Thread.Sleep(100);
        }
    }

    public static bool TryFocusWindowByTitle()
    {
        try
        {
            IntPtr hwnd = FindWindowW(null, WindowTitle);
            if (hwnd == IntPtr.Zero) return false;
            ShowWindow(hwnd, 9); // SW_RESTORE
            SetForegroundWindow(hwnd);
            return true;
        }
        catch { return false; }
    }

    private void ListenForShowRequests()
    {
        var handles = new WaitHandle[] { _showEvent, _cts.Token.WaitHandle };
        while (!_cts.IsCancellationRequested)
        {
            try
            {
                if (WaitHandle.WaitAny(handles) != 0) break;
                try { _onShowRequested(); } catch { /* ignore */ }
            }
            catch (ObjectDisposedException) { break; }
            catch { /* ignore */ }
        }
    }

    public void Dispose()
    {
        if (!_owned) return;
        _owned = false;
        try { _cts.Cancel(); } catch { /* ignore */ }
        try { _showEvent.Set(); } catch { /* ignore */ }
        try { if (_listener.IsAlive) _listener.Join(500); } catch { /* ignore */ }
        try { _showEvent.Dispose(); } catch { /* ignore */ }
        try { _mutex.ReleaseMutex(); } catch { /* ignore */ }
        try { _mutex.Dispose(); } catch { /* ignore */ }
        try { _cts.Dispose(); } catch { /* ignore */ }
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern IntPtr FindWindowW(string? lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
