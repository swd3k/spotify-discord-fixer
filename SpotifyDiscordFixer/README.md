# Spotify Discord Fixer

**v2.0.1** · лёгкий Windows-клиент для статуса Discord «Сейчас слушает Spotify».

Основная документация — в корне репозитория:

- [README](../README.md)
- [CHANGELOG](../CHANGELOG.md)
- [Releases](https://github.com/swd3k/spotify-discord-fixer/releases)

## Быстрый старт (разработка)

```powershell
cd SpotifyDiscordFixer
dotnet test -c Release
dotnet run --project src\SpotifyDiscordFixer.Ui -c Release
.\scripts\build-installer.ps1 -Version 2.0.1 -PublishFirst
```

| Проект | Роль |
|--------|------|
| **Core** | Логика блока hosts |
| **Infrastructure** | DNS, TCP, hosts, обновления |
| **Ui** | Photino + wwwroot |

MIT © 2026 [swd3k](https://github.com/swd3k)
