# Архив · Spotify Discord Fixer v1.1.0 (Electron)

> 📦 **Архивный релиз.** Не рекомендуется для новых установок.  
> Актуальная линейка — **[v2.0.1](https://github.com/swd3k/spotify-discord-fixer/releases/tag/v2.0.1)** (Windows, Photino, Setup ~2.6 МБ).  
> Сборки 1.x оставлены для истории (в т.ч. macOS / Linux).

**Тема:** бэкап hosts и снятие конфликтов.

### Исправлено
- **Бэкап hosts.** При применении / сбросе копия `hosts` сохраняется в **Загрузки**:  
  `Downloads\hosts_backup_YYYY-MM-DD_HH-mm.txt`. Путь выводится в сообщении об успехе.
- Перед Apply снимаются **конфликтующие** ручные строки Spotify.
- **UI:** отступ между спиннером и текстом «Применяю…» на кнопке применения.

### Изменено
- Версия **1.1.0** (Electron).

### Стек (legacy)
- Electron · multi-OS (Windows / macOS / Linux)

---

Полная история: [CHANGELOG.md](https://github.com/swd3k/spotify-discord-fixer/blob/main/CHANGELOG.md)
