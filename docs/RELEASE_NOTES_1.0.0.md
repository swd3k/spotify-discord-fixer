# Архив · Spotify Discord Fixer v1.0.0 (Electron)

> 📦 **Архивный релиз.** Не рекомендуется для новых установок.  
> Актуальная линейка — **[v2.0.1](https://github.com/swd3k/spotify-discord-fixer/releases/tag/v2.0.1)** (Windows, Photino, Setup ~2.6 МБ).  
> Сборки 1.x оставлены для истории (в т.ч. macOS / Linux).

**Тема:** первый публичный релиз.

### Добавлено
- **Свой IP** — ввод IPv4, проверка доступности (TCP :443), выбор узла для записи в `hosts`.
- **Выбор узла** — клик по доступному прокси в списке вместо только автовыбора «лучшего».
- **Предпросмотр** отражает выбранный (или лучший) узел.
- Сборки: **Windows** (x64 / arm64, Setup + portable), **Linux** (AppImage, deb), **macOS** (dmg, zip).
- Валидация IP, sandbox Electron, ротация бэкапов hosts, мониторинг активного узла.

### Стек (legacy)
- Electron · multi-OS

### Примечание
Неофициальный проект, не связан со Spotify / Discord / GeoHide.  
Трафик перенаправляемых доменов Spotify (включая авторизацию) идёт через сторонний сервис — **на свой риск**.

---

Полная история: [CHANGELOG.md](https://github.com/swd3k/spotify-discord-fixer/blob/main/CHANGELOG.md)
