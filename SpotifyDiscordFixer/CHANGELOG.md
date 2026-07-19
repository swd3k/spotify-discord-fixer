# Changelog

All notable changes to **Spotify Discord Fixer** are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- *(none yet)*

### Fixed
- *(none yet)*

---

## [2.0.0] — 2026-07-19

**Major rewrite:** Electron (~391 MB) → **.NET 8 + Photino/WebView2** (framework-dependent Setup ~few MB). Windows only.

### Added
- Solution layout: Core / Infrastructure / Ui (AntiLag Next style).
- Pure hosts-block engine (markers `#spotify-discord-hosts` … `#end-spotify-discord-hosts` unchanged for upgrade path).
- GeoHide DNS + fallback IPs, TCP :443 latency probe.
- Apply / remove hosts with backup to Downloads, conflict strip on apply, DNS flush, elevated write when needed.
- Photino UI: IP list, custom IP, preview, logs, consent, theme, tray, single-instance, autostart.
- In-app auto-update from GitHub Releases (allowlisted Setup URL, PE check, silent when installed under Program Files).
- Multi-arch Setup + portable zips: win-x64, win-x86, win-arm64.

### Changed
- Product name: **Spotify Discord Fixer** (was “Hosts Fixer” in some artifact names).
- Setup assets: `Spotify-Discord-Fixer-Setup-{version}-{rid}.exe`.
- Platform scope: **Windows only** (macOS/Linux remain on legacy Electron 1.x builds if published).

### Removed
- Electron, React, Node ship tree from the 2.0 binary (source may still archive legacy folders).

### Notes
- Requires [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) and [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/).
- Administrator (UAC) for hosts write.

---

## Version map

| Version | Date | Highlights |
|---------|------|------------|
| **2.0.0** | 2026-07-19 | Photino rewrite, light Setup, auto-update |
| **1.1.0** | 2026-07-15 | Electron: Downloads backup, conflict strip |
| **1.0.0** | 2026 | First Electron public release |

---

## Links

- Repository: https://github.com/swd3k/spotify-discord-fixer  
- Releases: https://github.com/swd3k/spotify-discord-fixer/releases  
