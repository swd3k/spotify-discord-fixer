# Spotify Discord Fixer **2.0**

Восстанавливает статус Discord **«Сейчас слушает Spotify»**, направляя домены Spotify через прокси (GeoHide или ваш IP) с помощью системного файла **hosts**.

**Только Windows.** Лёгкий rewrite Electron-версии: **.NET 8 + Photino/WebView2** — Setup около **2–3 МБ** вместо ~390 МБ.

<p>
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest"><img alt="версия" src="https://img.shields.io/github/v/release/swd3k/spotify-discord-fixer?style=flat-square&label=версия" /></a>
  <img alt="платформа" src="https://img.shields.io/badge/платформа-Windows-lightgrey?style=flat-square" />
  <img alt="лицензия" src="https://img.shields.io/badge/лицензия-MIT-brightgreen?style=flat-square" />
  <a href="https://github.com/swd3k"><img alt="автор" src="https://img.shields.io/badge/автор-swd3k-24292e?style=flat-square&logo=github&logoColor=white" /></a>
</p>

Разработчик: [swd3k](https://github.com/swd3k) · [Релизы](https://github.com/swd3k/spotify-discord-fixer/releases) · [История изменений](CHANGELOG.md) · MIT

---

> [!NOTE]
> **Неофициальный** open-source инструмент. Не связан со Spotify, Discord или GeoHide.  
> **Используйте на свой страх и риск.** Для изменения `hosts` нужны права **администратора** (UAC).

> [!CAUTION]
> ### Фейки
> Официальный источник — **только** этот репозиторий GitHub. Всё остальное под этим именем — фейк.

---

## Скачать

Берите сборки со страницы **[Releases](https://github.com/swd3k/spotify-discord-fixer/releases)** (тег `v2.0.0+`).

| Файл | Архитектура | Примечание |
|------|-------------|------------|
| `Spotify-Discord-Fixer-Setup-2.0.0-win-x64.exe` | Intel/AMD 64-bit | **Рекомендуется** |
| `Spotify-Discord-Fixer-Setup-2.0.0-win-x86.exe` | 32-bit | Установщик |
| `Spotify-Discord-Fixer-Setup-2.0.0-win-arm64.exe` | ARM64 | Установщик |
| `Spotify-Discord-Fixer-win-*.zip` | все | Portable-папка |

**Среда (framework-dependent):** [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) + [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (обычно уже есть на Windows 10/11).

Старые сборки **1.x Electron** (в т.ч. macOS/Linux) могут остаться на прошлых тегах.

---

## Возможности

1. Резолв `geohide.ru` + резервные IP, задержка **TCP :443**.  
2. Лучший узел / ручной выбор / свой IPv4.  
3. **Применить** → бэкап hosts в **Загрузки**, снятие конфликтующих строк Spotify, запись managed-блока.  
4. **Сбросить** → удаляется только managed-блок.  
5. Трей, один экземпляр, автозапуск (`--hidden`).  
6. Проверка обновлений с GitHub Releases (только официальный Setup).

Маркеры hosts (как в 1.x): `#spotify-discord-hosts` … `#end-spotify-discord-hosts`.

---

## Сборка из исходников

```powershell
cd SpotifyDiscordFixer
dotnet test -c Release
dotnet run --project src\SpotifyDiscordFixer.Ui -c Release

# Публикация всех архитектур + Setup.exe (нужен Inno Setup 6)
.\scripts\build-installer.ps1 -Version 2.0.0 -PublishFirst
```

| Слой | Назначение |
|------|------------|
| `SpotifyDiscordFixer.Core` | Чистая логика блока hosts |
| `SpotifyDiscordFixer.Infrastructure` | Проба узлов, I/O hosts, обновления |
| `SpotifyDiscordFixer.Ui` | Photino-хост + wwwroot |

Артефакты: `dist\SpotifyDiscordFixer-win-*`, `dist\installers\Spotify-Discord-Fixer-Setup-*`.

---

## Безопасность

- Трафик перечисленных доменов Spotify идёт через **сторонний** GeoHide (или ваш IP).  
- Приложение **не** ставит корневые сертификаты.  
- Нет телеметрии.  
- Апдейтер качает только официальные URL Setup и проверяет PE.

---

## Лицензия

MIT © 2026 [swd3k](https://github.com/swd3k)
