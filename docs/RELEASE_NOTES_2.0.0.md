# Spotify Discord Fixer v2.0.0

**Тема: rewrite** — Electron (~391 МБ) → **.NET 8 + Photino / WebView2** (Setup ~2.6 МБ). Только Windows.

### Добавлено
- Слои **Core** / **Infrastructure** / **Ui**.
- Блок hosts с маркерами 1.x (`#spotify-discord-hosts` … `#end-spotify-discord-hosts`) — безопасный апгрейд с Electron.
- GeoHide + резервные IP, проверка **TCP :443**, свой IPv4.
- Apply / Remove, бэкап в «Загрузки», трей, single-instance, автозапуск.
- Автообновление с GitHub (allowlist Setup + проверка PE).
- Setup и portable: **win-x64** / **win-x86** / **win-arm64**.

### Изменено
- Платформа: **только Windows** (macOS / Linux — в архиве 1.x).
- Размер Setup ~**2.6 МБ** вместо ~390 МБ.

---

**Требования:** Windows 10/11 · [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) · [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) · **права администратора** для hosts

> Актуальная версия: **[v2.0.1](https://github.com/swd3k/spotify-discord-fixer/releases/tag/v2.0.1)**.

Полная история: [CHANGELOG.md](https://github.com/swd3k/spotify-discord-fixer/blob/main/CHANGELOG.md) · [README](https://github.com/swd3k/spotify-discord-fixer#readme)
