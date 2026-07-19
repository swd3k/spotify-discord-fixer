# История изменений

Все заметные изменения **Spotify Discord Fixer**.  
Формат близок к [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/) · [Semantic Versioning](https://semver.org/lang/ru/).

---

## [Unreleased]

### Добавлено
- *(пусто)*

### Исправлено
- *(пусто)*

---

## [2.0.1] — 2026-07-19

**Полировка 2.0** — UI/UX, русские тексты, чистый репозиторий.

### Исправлено
- **Баннер обновлений** — корректное поле `latest`, кнопки «Установить» / «Открыть Releases», флаг `needsBrowser` и выход после silent-install
- **Кнопки Apply / Reset** — единое состояние disabled/loading, без «залипания» после busy
- **UAC** — понятная отмена, таймаут elevated-записи, проверка, что блок hosts реально записан
- **Dismiss IP** — сохраняется в `localStorage` между запусками
- **Трей** — balloon один раз за процесс

### Изменено
- UI: компактная сетка, сворачиваемый блок «Как это работает», зелёный бейдж «Активно», модалка (фон + Esc), спиннер «Применяю…»
- Документация и release notes **на русском**
- Репозиторий очищен от Electron/Node — на `main` только Photino 2.x
- Версия **2.0.1**

---

## [2.0.0] — 2026-07-19

**Крупный rewrite:** Electron (~391 МБ) → **.NET 8 + Photino / WebView2** (Setup ~2.6 МБ).  
Только **Windows** (x64 / x86 / arm64).

### Добавлено
- Слои **Core** / **Infrastructure** / **Ui**
- Блок hosts с маркерами 1.x (`#spotify-discord-hosts` … `#end-spotify-discord-hosts`) — безопасный апгрейд с 1.x
- GeoHide + резервные IP, проверка **TCP :443**, свой IPv4
- Apply / Remove, бэкап в «Загрузки», трей, single-instance, автозапуск (`--hidden`)
- Автообновление с GitHub (allowlist Setup + проверка PE)
- Setup и portable: **win-x64** / **win-x86** / **win-arm64**

### Требования
- Windows 10 / 11 · .NET 8 Desktop Runtime · WebView2 · UAC для hosts

---

## Карта версий

| Версия | Дата | Суть |
|--------|------|------|
| **2.0.1** | 2026-07-19 | UI/UX polish, RU docs, cleanup repo |
| **2.0.0** | 2026-07-19 | Photino rewrite, лёгкий Setup |
| **1.1.0** | 2026-07-15 | Electron: бэкап Downloads, конфликты |
| **1.0.0** | 2026 | Первый Electron-релиз |

> Релизы **1.x** (Electron, multi-OS) остаются на [GitHub Releases](https://github.com/swd3k/spotify-discord-fixer/releases) как legacy.

---

## Ссылки

- [Репозиторий](https://github.com/swd3k/spotify-discord-fixer)
- [Релизы](https://github.com/swd3k/spotify-discord-fixer/releases)
- [Корень README](https://github.com/swd3k/spotify-discord-fixer#readme)
