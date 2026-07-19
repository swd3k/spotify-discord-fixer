# История изменений

Все заметные пользовательские изменения **Spotify Discord Fixer**.  
Формат близок к [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/) · [Semantic Versioning](https://semver.org/lang/ru/).

---

## [2.0.1] — 2026-07-19

**Тема: полировка 2.0** — UI/UX, надёжность обновлений и UAC, русская документация, чистый репозиторий.

### Исправлено
- **Баннер обновлений** — корректное поле `latest`, кнопки «Установить» / «Открыть Releases», `needsBrowser` и выход после silent-install.
- **Кнопки Применить / Сбросить** — единое состояние disabled/loading, без «залипания» после busy.
- **UAC** — понятная отмена, таймаут elevated-записи, проверка, что блок hosts реально записан.
- **Dismiss IP** — сохраняется в `localStorage` между запусками.
- **Трей** — balloon один раз за процесс.

### Изменено
- UI: компактная сетка, сворачиваемый блок «Как это работает», зелёный бейдж «Активно», модалка (фон + Esc), спиннер «Применяю…».
- Документация и release notes **на русском**.
- Репозиторий очищен от Electron/Node — на `main` только Photino 2.x.
- Версия продукта **2.0.1**.

---

## [2.0.0] — 2026-07-19

**Тема: rewrite** — Electron (~391 МБ) → **.NET 8 + Photino / WebView2** (Setup ~2.6 МБ). Только Windows.

### Добавлено
- Слои **Core** / **Infrastructure** / **Ui**.
- Блок hosts с маркерами 1.x (`#spotify-discord-hosts` … `#end-spotify-discord-hosts`) — безопасный апгрейд.
- GeoHide + резервные IP, проверка **TCP :443**, свой IPv4.
- Apply / Remove, бэкап в «Загрузки», трей, single-instance, автозапуск.
- Автообновление с GitHub (allowlist Setup + проверка PE).
- Setup и portable: **win-x64** / **win-x86** / **win-arm64**.

### Требования
- Windows 10 / 11 · .NET 8 Desktop Runtime · WebView2 · UAC для hosts.

---

## Архив 1.x (Electron)

> Сборки **legacy** (Windows / macOS / Linux). Не обновляются.  
> Актуальная линейка — **2.x** (только Windows, Photino).

### [1.1.0] — 2026-07-15 *(архив)*

#### Исправлено
- **Бэкап hosts** в папку **Загрузки**: `Downloads\hosts_backup_YYYY-MM-DD_HH-mm.txt`.
- Перед Apply снимаются **конфликтующие** ручные строки Spotify.
- **UI:** отступ между спиннером и текстом «Применяю…».

#### Изменено
- Версия **1.1.0**.

### [1.0.0] — 2026 *(архив)*

#### Добавлено
- Первый публичный релиз на **Electron**.
- **Свой IP** — ввод IPv4, проверка TCP :443, запись в hosts.
- **Выбор узла** из списка вместо только автовыбора.
- **Предпросмотр** выбранного / лучшего узла.
- Сборки: Windows (Setup + portable), Linux (AppImage, deb), macOS (dmg, zip).

---

## Ссылки

- [Репозиторий](https://github.com/swd3k/spotify-discord-fixer)
- [Релизы](https://github.com/swd3k/spotify-discord-fixer/releases)
