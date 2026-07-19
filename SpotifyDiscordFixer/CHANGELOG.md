# История изменений

Все заметные изменения **Spotify Discord Fixer** фиксируются здесь.

Формат близок к [Keep a Changelog](https://keepachangelog.com/).  
Версии — [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Добавлено
- *(пока пусто)*

### Исправлено
- *(пока пусто)*

---

## [2.0.0] — 2026-07-19

**Крупный rewrite:** Electron (~391 МБ) → **.NET 8 + Photino/WebView2** (Setup ~несколько МБ). Только Windows.

### Добавлено
- Структура решения: Core / Infrastructure / Ui (по образцу AntiLag Next).
- Чистый движок блока hosts (маркеры `#spotify-discord-hosts` … `#end-spotify-discord-hosts` **без смены** — путь обновления с 1.x).
- DNS GeoHide + резервные IP, проба TCP :443.
- Применить / сбросить hosts: бэкап в Загрузки, снятие конфликтов при apply, flush DNS, elev при необходимости.
- UI Photino: список IP, свой IP, превью, лог, согласие, тема, трей, single-instance, автозапуск.
- Автообновление с GitHub Releases (allowlist Setup URL, проверка PE, silent из Program Files).
- Multi-arch Setup + portable zip: win-x64, win-x86, win-arm64.
- Полировка: banner обновлений, отмена UAC, dismiss IP в localStorage.

### Изменено
- Имя продукта: **Spotify Discord Fixer**.
- Имена Setup: `Spotify-Discord-Fixer-Setup-{version}-{rid}.exe`.
- Платформы: **только Windows** (macOS/Linux — legacy Electron 1.x на старых тегах).

### Удалено
- Electron / React / Node из поставляемого бинарника 2.0.

### Примечания
- Нужны [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) и [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/).
- Для записи hosts — права администратора (UAC).

---

## Карта версий

| Версия | Дата | Кратко |
|--------|------|--------|
| **2.0.0** | 2026-07-19 | Photino rewrite, лёгкий Setup, автообновление |
| **1.1.0** | 2026-07-15 | Electron: бэкап в Загрузки, снятие конфликтов |
| **1.0.0** | 2026 | Первый публичный релиз Electron |

---

## Ссылки

- Репозиторий: https://github.com/swd3k/spotify-discord-fixer  
- Релизы: https://github.com/swd3k/spotify-discord-fixer/releases  
