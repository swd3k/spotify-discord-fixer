<p align="center">
  <img src="../docs/banner.png" alt="Spotify Discord Fixer" width="100%" onerror="this.style.display='none'">
</p>

# Spotify Discord Fixer **2.0**

Restores Discord’s **Listening to Spotify** status by routing Spotify domains through a proxy via the system **hosts** file (GeoHide or your IP).

**Windows-only** lightweight rewrite of the Electron app: **.NET 8 + Photino/WebView2** — Setup ~few MB instead of ~390 MB.

<p>
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest"><img alt="version" src="https://img.shields.io/github/v/release/swd3k/spotify-discord-fixer?style=flat-square&label=version" /></a>
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows-lightgrey?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" />
  <a href="https://github.com/swd3k"><img alt="author" src="https://img.shields.io/badge/author-swd3k-24292e?style=flat-square&logo=github&logoColor=white" /></a>
</p>

Developer: [swd3k](https://github.com/swd3k) · [Releases](https://github.com/swd3k/spotify-discord-fixer/releases) · [Changelog](CHANGELOG.md) · MIT

---

> [!NOTE]
> Unofficial open-source tool. Not affiliated with Spotify, Discord, or GeoHide.  
> **Use at your own risk.** Changing `hosts` requires **Administrator** (UAC).

> [!CAUTION]
> ### Fakes
> Official source is **only** this GitHub repository. Anything else under this name is fake.

---

## Download

Prefer **[Releases](https://github.com/swd3k/spotify-discord-fixer/releases)** (tag `v2.0.0+`).

| Package | Arch | Notes |
|---------|------|--------|
| `Spotify-Discord-Fixer-Setup-2.0.0-win-x64.exe` | Intel/AMD 64-bit | **Recommended** installer |
| `Spotify-Discord-Fixer-Setup-2.0.0-win-x86.exe` | 32-bit | Installer |
| `Spotify-Discord-Fixer-Setup-2.0.0-win-arm64.exe` | ARM64 | Installer |
| `Spotify-Discord-Fixer-win-*.zip` | all | Portable folder |

**Runtime (framework-dependent builds):** [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) + [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (usually preinstalled on Win 10/11).

Legacy **1.x Electron** builds (macOS/Linux/Windows large) may still appear on older tags.

---

## Features

1. Resolve `geohide.ru` + fallback IPs, TCP **:443** latency.  
2. Pick best / manual / custom IPv4.  
3. **Apply** → backup hosts to **Downloads**, strip conflicting Spotify lines, write managed block.  
4. **Reset** → remove only the managed block.  
5. Tray minimize, single instance, autostart (`--hidden`).  
6. In-app **update check** from GitHub Releases (allowlisted Setup).

Hosts markers (unchanged from 1.x): `#spotify-discord-hosts` … `#end-spotify-discord-hosts`.

---

## Build from source

```powershell
cd SpotifyDiscordFixer
dotnet test -c Release
dotnet run --project src\SpotifyDiscordFixer.Ui -c Release

# Publish all arch + Setup.exe (needs Inno Setup 6)
.\scripts\build-installer.ps1 -Version 2.0.0 -PublishFirst
```

| Layer | Role |
|-------|------|
| `SpotifyDiscordFixer.Core` | Pure hosts block logic |
| `SpotifyDiscordFixer.Infrastructure` | Probe, hosts I/O, update |
| `SpotifyDiscordFixer.Ui` | Photino host + wwwroot |

Output: `dist\SpotifyDiscordFixer-win-*`, `dist\installers\Spotify-Discord-Fixer-Setup-*`.

---

## Security

- Traffic for listed Spotify domains goes through **third-party** GeoHide (or your IP).  
- No root CA install by this app.  
- No telemetry.  
- Updater downloads only official repo Setup URLs + PE checks.

---

## License

MIT © 2026 [swd3k](https://github.com/swd3k)
