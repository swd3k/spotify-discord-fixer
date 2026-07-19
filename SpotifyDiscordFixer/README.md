<p align="center">
  <img src="../docs/banner.png" alt="Spotify Discord Fixer" width="100%">
</p>

<br>

<h1 align="center">Spotify Discord Fixer</h1>

<p align="center">
  <strong>v2.0.1</strong> · лёгкий Windows-клиент для статуса Discord «Сейчас слушает Spotify»
</p>

<p align="center">
  Направляет домены Spotify через прокси (GeoHide или ваш IP) с помощью системного файла <code>hosts</code>.
</p>

<p align="center">
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest"><img alt="версия" src="https://img.shields.io/github/v/release/swd3k/spotify-discord-fixer?style=flat-square&label=версия" /></a>
  <img alt="платформа" src="https://img.shields.io/badge/платформа-Windows-lightgrey?style=flat-square" />
  <img alt="лицензия" src="https://img.shields.io/badge/лицензия-MIT-brightgreen?style=flat-square" />
  <img alt=".NET" src="https://img.shields.io/badge/.NET-8-512BD4?style=flat-square&logo=dotnet&logoColor=white" />
  <img alt="размер" src="https://img.shields.io/badge/Setup-~2.6%20МБ-success?style=flat-square" />
</p>

<p align="center">
  <a href="https://github.com/swd3k">swd3k</a>
  ·
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases">Релизы</a>
  ·
  <a href="CHANGELOG.md">История</a>
  ·
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe">
    <img alt="Скачать Setup win-x64" src="https://img.shields.io/badge/⬇%20Скачать-Setup%20win--x64-1DB954?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  &nbsp;
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest">
    <img alt="Все релизы" src="https://img.shields.io/badge/Все%20релизы-2a292d?style=for-the-badge" />
  </a>
</p>

<p align="center">
  <sub>
    <code>Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe</code>
    · portable zip на
    <a href="https://github.com/swd3k/spotify-discord-fixer/releases">Releases</a>
  </sub>
</p>

---

> [!NOTE]
> **Неофициальный** open-source. Не связан со Spotify, Discord или GeoHide.  
> **На свой страх и риск.** Для `hosts` нужны права **администратора** (UAC).

> [!CAUTION]
> ### Фейки
> Официальный источник — **только** [этот репозиторий](https://github.com/swd3k/spotify-discord-fixer).

---

## Зачем это

Discord иногда не показывает «Слушает Spotify», если домены Spotify недоступны или режутся.  
Приложение пишет в `hosts` блок, который направляет эти домены на **прокси GeoHide** (или ваш IP).

| | |
|--|--|
| **Стек** | .NET 8 + Photino / WebView2 |
| **Размер Setup** | ~2.6 МБ (вместо ~390 МБ у Electron 1.x) |
| **ОС** | Windows 10 / 11 (x64, x86, arm64) |

---

## Скачать

| Файл | Для кого |
|------|----------|
| [`…-Setup-2.0.1-win-x64.exe`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe) | **Большинству** (Intel / AMD 64-bit) |
| [`…-Setup-2.0.1-win-x86.exe`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x86.exe) | 32-bit |
| [`…-Setup-2.0.1-win-arm64.exe`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-arm64.exe) | ARM64 |
| `Spotify-Discord-Fixer-win-*.zip` | Portable |

**Нужно:** [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) · [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (часто уже стоит).

### Быстрый старт

1. Установите Setup (UAC — нормально).  
2. **Обновить** список узлов (или введите свой IP).  
3. **Обновить и применить** → согласие + UAC.  
4. Перезапустите **Discord** и **Spotify**.  
5. Если что-то не так → **Сбросить hosts**.

---

## Возможности

- Автовыбор лучшего прокси по задержке **TCP :443** или ручной выбор  
- **Свой IPv4** — проверка и запись в hosts  
- Бэкап в **Загрузки** перед изменениями  
- Предпросмотр блока и текущего состояния hosts  
- Трей, один экземпляр, автозапуск свёрнуто  
- Светлая / тёмная тема  
- Проверка обновлений из приложения  

Маркеры (как в 1.x): `#spotify-discord-hosts` … `#end-spotify-discord-hosts`.

---

## Сборка

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

Выход: `dist/installers/`, `dist/*.zip`.

---

## Безопасность

- Трафик Spotify-доменов (включая авторизацию) идёт через **сторонний** прокси.  
- Нет установки корневых CA, нет телеметрии.  
- Апдейтер качает только официальный Setup с allowlist URL + проверка PE.

---

## Лицензия

MIT © 2026 [swd3k](https://github.com/swd3k)
