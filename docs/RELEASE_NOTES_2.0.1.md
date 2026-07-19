# Spotify Discord Fixer v2.0.1

**Тема: полировка 2.0** — UI/UX, надёжность обновлений и UAC, русская документация, чистый репозиторий.

### Исправлено
- **Баннер обновлений** — корректное поле `latest`, кнопки «Установить» / «Открыть Releases», `needsBrowser` и выход после silent-install.
- **Кнопки Применить / Сбросить** — единое состояние disabled/loading, без «залипания» после busy.
- **UAC** — понятная отмена, таймаут elevated-записи, проверка, что блок hosts реально записан.
- **Dismiss IP** — сохраняется в `localStorage` между запусками.
- **Трей** — balloon один раз за процесс.

### Изменено
- UI: компактная сетка, сворачиваемый блок «Как это работает», зелёный бейдж **Активно**, модалка (фон + Esc), спиннер «Применяю…».
- Документация и release notes **на русском**.
- Репозиторий очищен от Electron/Node — на `main` только Photino 2.x.
- Версия продукта **2.0.1**.

---

**Требования:** Windows 10/11 · [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) · [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) · **права администратора** для hosts

**Скачать (рекомендуется):** [Setup win-x64](https://github.com/swd3k/spotify-discord-fixer/releases/download/v2.0.1/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe)

Полная история: [CHANGELOG.md](https://github.com/swd3k/spotify-discord-fixer/blob/main/CHANGELOG.md) · [README](https://github.com/swd3k/spotify-discord-fixer#readme)
