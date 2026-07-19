<p align="center">
  <strong>Spotify Discord Fixer 2.0.0</strong><br/>
  <em>Крупный rewrite · Electron → .NET 8 + Photino · Setup ~2.6 МБ</em>
</p>

---

## Главное

| Было (1.x) | Стало (2.0) |
|------------|-------------|
| Electron ~390 МБ | **Photino / WebView2 ~2.6 МБ** |
| multi-OS | **Windows only** (x64 / x86 / arm64) |

Маркеры hosts **как в 1.x** — апгрейд не ломает блок:
`#spotify-discord-hosts` … `#end-spotify-discord-hosts`.

### Возможности
- GeoHide + резервные IP, **TCP :443**, свой IPv4  
- Apply / Reset, бэкап в **Загрузки**, снятие конфликтов  
- Трей, single-instance, автозапуск свёрнуто  
- Автообновление с GitHub (allowlist Setup + PE)  
- Светлая / тёмная тема  

### Требования
- Windows 10 / 11  
- [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0)  
- [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)  
- UAC для записи hosts  

### Скачать
| Файл | |
|------|--|
| **[Setup win-x64](https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.0.0/Spotify-Discord-Fixer-Setup-2.0.0-win-x64.exe)** | рекомендуется |
| [Setup win-x86](https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.0.0/Spotify-Discord-Fixer-Setup-2.0.0-win-x86.exe) | |
| [Setup win-arm64](https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.0.0/Spotify-Discord-Fixer-Setup-2.0.0-win-arm64.exe) | |

> Актуальная версия: **[2.0.1](https://github.com/swd3k/spotify-discord-fixer/releases/tag/v2.0.1)** (UI polish).  
> 1.x (Electron, macOS/Linux) — на [старых релизах](https://github.com/swd3k/spotify-discord-fixer/releases).

Полный журнал: [CHANGELOG](https://github.com/swd3k/spotify-discord-fixer/blob/main/SpotifyDiscordFixer/CHANGELOG.md)
