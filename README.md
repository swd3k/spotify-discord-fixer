<p align="center">
  <img src="docs/banner.png" alt="Spotify Discord Fixer" width="100%">
</p>

<br>

<h1 align="center">Spotify Discord Fixer</h1>

<p align="center">
  Восстанавливает статус Discord <strong>«Сейчас слушает Spotify»</strong><br>
  через системный файл <code>hosts</code> и прокси GeoHide (или ваш IP).
</p>

<p align="center">
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest"><img alt="версия" src="https://img.shields.io/github/v/release/swd3k/spotify-discord-fixer?style=flat-square&label=версия" /></a>
  <img alt="платформа" src="https://img.shields.io/badge/платформа-Windows-lightgrey?style=flat-square" />
  <img alt="лицензия" src="https://img.shields.io/badge/лицензия-MIT-brightgreen?style=flat-square" />
  <img alt="статус" src="https://img.shields.io/badge/статус-релиз-brightgreen?style=flat-square" />
  <a href="https://github.com/swd3k"><img alt="автор" src="https://img.shields.io/badge/автор-swd3k-24292e?style=flat-square&logo=github&logoColor=white" /></a>
  <img alt=".NET" src="https://img.shields.io/badge/.NET-8-512BD4?style=flat-square&logo=dotnet&logoColor=white" />
  <img alt="размер" src="https://img.shields.io/badge/Setup-~2.6%20МБ-success?style=flat-square" />
</p>

<p align="center">
  <a href="https://github.com/swd3k">swd3k</a>
  ·
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases">Релизы</a>
  ·
  <a href="SpotifyDiscordFixer/CHANGELOG.md">История</a>
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
    Актуальная версия: <strong>2.0.1</strong>
    · <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe"><code>Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe</code></a>
    · portable на <a href="https://github.com/swd3k/spotify-discord-fixer/releases">Releases</a>
  </sub>
</p>

---

> [!NOTE]
> **Неофициальный** open-source. Не связан со Spotify, Discord или GeoHide.  
> **На свой страх и риск.** Для изменения `hosts` нужны права администратора (UAC).

**v2.x** — Windows-приложение на **.NET 8 + Photino / WebView2** (Setup ~2.6 МБ).  
Код: [`SpotifyDiscordFixer/`](SpotifyDiscordFixer/).

---

> [!CAUTION]
> ### 🚫 Фейки
> Единственный официальный источник — **этот репозиторий GitHub**.  
> Всё остальное под этим именем — фейк.

> [!WARNING]
> ### 🛡️ SmartScreen и антивирусы
> Приложение меняет `hosts` и запрашивает UAC. Неподписанный Setup может вызвать предупреждение Windows.  
> Исходники открыты — проверяйте и собирайте сами при необходимости.  
> **«Подробнее» → «Выполнить в любом случае»**, если доверяете релизу с GitHub.

> [!IMPORTANT]
> - Скачивайте **только** с [Releases](https://github.com/swd3k/spotify-discord-fixer/releases).  
> - Перенаправляются и домены **авторизации** Spotify — трафик через GeoHide / ваш IP.  
> - Перед записью — бэкап в **Загрузки**; откат — **«Сбросить hosts»**.  
> - **v2 — только Windows.** Старые 1.x (Electron) — на прошлых тегах (в т.ч. macOS / Linux).

---

## ⚙️ Как это работает

1. Резолв `geohide.ru` + резервные IP, проверка **TCP :443**.  
2. Выбор лучшего / ручной / **свой IPv4**.  
3. **Обновить и применить** → UAC → бэкап → снятие конфликтов → блок  
   `#spotify-discord-hosts` … `#end-spotify-discord-hosts`.  
4. Мониторинг активного узла; **Сбросить hosts** убирает только managed-блок.

---

## 📥 Скачать

| Файл | Для кого |
|------|----------|
| [Setup **win-x64**](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe) | **Рекомендуется** (Intel / AMD 64-bit) |
| [Setup win-x86](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x86.exe) | 32-bit |
| [Setup win-arm64](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-arm64.exe) | ARM64 |
| Portable `Spotify-Discord-Fixer-win-*.zip` | Без установщика |

**Среда:** [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) · [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (часто уже установлен).

### Быстрый старт

1. Установите Setup (запрос UAC — нормально).  
2. **Обновить** список узлов (или введите свой IP).  
3. **Обновить и применить** → согласие + UAC.  
4. Перезапустите **Discord** и **Spotify**.  
5. Если что-то не так → **Сбросить hosts**.

---

## ✨ Возможности

| | |
|--|--|
| 🚀 | Лучший узел по задержке **TCP :443** или ручной выбор |
| 🎯 | Свой IPv4 + проверка доступности |
| 💾 | Бэкап hosts в **Загрузки** перед изменениями |
| 👀 | Превью блока и текущего hosts |
| 🖥️ | Трей, один экземпляр, автозапуск свёрнуто |
| 🎨 | Светлая / тёмная тема |
| 🔄 | Проверка обновлений из приложения |
| 📦 | Setup **~2.6 МБ** (не Electron ~390 МБ) |

---

## 🛠️ Сборка

```powershell
cd SpotifyDiscordFixer
dotnet test -c Release
dotnet run --project src\SpotifyDiscordFixer.Ui -c Release

.\scripts\build-installer.ps1 -Version 2.0.1 -PublishFirst
```

| Слой | Назначение |
|------|------------|
| **Core** | Логика блока hosts |
| **Infrastructure** | DNS, TCP, hosts, update |
| **Ui** | Photino + wwwroot |

Выход: `dist/installers/`, `dist/*.zip`.

---

## 📂 Репозиторий

```
SpotifyDiscordFixer/     ← продукт 2.x (Photino)
docs/                    ← banner
README.md · CHANGELOG.md · LICENSE
```

---

## 📄 Лицензия

MIT © 2026 [swd3k](https://github.com/swd3k)
