<p align="center">
  <img src="docs/banner.png" alt="Spotify Discord Fixer" width="100%">
</p>

<br>

<h1 align="center">Spotify Discord Fixer</h1>

<p align="center">
  Восстанавливает статус Discord <strong>«Сейчас слушает Spotify»</strong>
  через системный файл <code>hosts</code> и прокси GeoHide (или ваш IP).
</p>

<p align="center">
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest"><img alt="version" src="https://img.shields.io/github/v/release/swd3k/spotify-discord-fixer?style=flat-square&label=version" /></a>
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows-lightgrey?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" />
  <img alt="status" src="https://img.shields.io/badge/status-release-brightgreen?style=flat-square" />
  <a href="https://github.com/swd3k"><img alt="author" src="https://img.shields.io/badge/author-swd3k-24292e?style=flat-square&logo=github&logoColor=white" /></a>
  <img alt=".NET" src="https://img.shields.io/badge/.NET-8-512BD4?style=flat-square&logo=dotnet&logoColor=white" />
  <img alt="size" src="https://img.shields.io/badge/Setup-~2.6%20MB-success?style=flat-square" />
</p>

<p align="center">
  Разработчик: <a href="https://github.com/swd3k">swd3k</a>
  ·
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases">Релизы</a>
  ·
  <a href="CHANGELOG.md">История</a>
  ·
  <a href="LICENSE">MIT</a>
</p>

---

> [!NOTE]
> **Неофициальный** open-source. Не связан со Spotify, Discord или GeoHide.  
> **На свой страх и риск.** Для изменения `hosts` нужны права **администратора** (UAC).

Десктоп-приложение для **Windows 10 / 11** на **.NET 8 + Photino / WebView2** (Setup ~2.6 МБ).  
Пишет в `hosts` управляемый блок, направляющий домены Spotify на **прокси GeoHide** (или ваш IPv4).  
Один клик **Применить**, полный **Сброс hosts**, трей и автозапуск.

Пользовательская история: **[CHANGELOG.md](CHANGELOG.md)**.  
Код 2.x: [`SpotifyDiscordFixer/`](SpotifyDiscordFixer/).

---

> [!CAUTION]
> ### 🚫 Фейки
> Я **не** веду другие страницы, группы, Telegram или YouTube по этому проекту.  
> **Единственный** официальный источник — **этот репозиторий GitHub**.  
> Всё, что распространяется под этим именем вне репозитория — **фейк**.

> [!WARNING]
> ### 🛡️ Антивирусы и SmartScreen
> Приложение запрашивает **UAC** и меняет системный файл `hosts`.  
> Защита Windows или антивирус могут пометить **неподписанный** Setup.  
> Это **не вирус**: исходники открыты — проверьте или соберите сами.
>
> Если доверяете сборке с GitHub Releases: **«Подробнее» → «Выполнить в любом случае»**.  
> При необходимости добавьте папку приложения в исключения антивируса.

> [!IMPORTANT]
> ### 🔐 Важно знать
> - Скачивайте **только** с [Releases](https://github.com/swd3k/spotify-discord-fixer/releases).  
> - Перенаправляются и домены **авторизации** Spotify — трафик идёт через GeoHide / ваш IP.  
> - Перед записью создаётся **бэкап** в «Загрузки»; откат — **Сбросить hosts**.  
> - **v2.x — только Windows.** Архив 1.x (Electron, macOS / Linux) — на [старых релизах](https://github.com/swd3k/spotify-discord-fixer/releases) с пометкой **Архив**.

---

## ⚙️ Как это работает

1. Резолв `geohide.ru` и резервных IP, проверка **TCP :443**.  
2. Автовыбор лучшего узла, ручной выбор или **свой IPv4**.  
3. **Обновить и применить** → согласие → UAC → бэкап → снятие конфликтов → блок  
   `#spotify-discord-hosts` … `#end-spotify-discord-hosts`.  
4. Мониторинг активного узла; **Сбросить hosts** удаляет только managed-блок.

Маркеры совпадают с 1.x — апгрейд с Electron **не ломает** уже записанный блок.

---

## 🔒 Безопасность

- Трафик выбранных доменов Spotify (включая авторизацию) идёт через **сторонний** прокси.  
- Нет установки корневых CA, нет телеметрии.  
- Автообновление: только официальный Setup с **allowlist URL** + проверка PE.  
- Elevated-запись hosts через UAC; отмена и таймаут обрабатываются явно.

---

## 📥 Скачать

Сборки — на **[Releases](https://github.com/swd3k/spotify-discord-fixer/releases)**.  
Актуальная версия: **2.0.1**.

### Setup (рекомендуется)

| Пакет | Архитектура | Примечание |
|-------|-------------|------------|
| [`Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x64.exe) | Intel / AMD 64-bit | **Большинству** |
| [`Spotify-Discord-Fixer-Setup-2.0.1-win-x86.exe`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-x86.exe) | 32-bit | |
| [`Spotify-Discord-Fixer-Setup-2.0.1-win-arm64.exe`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.1-win-arm64.exe) | ARM64 | |

1. Запустите **Setup** `.exe` (UAC).  
2. Откройте приложение → **Обновить** список узлов.  
3. **Обновить и применить** → согласие + UAC.  
4. Перезапустите **Discord** и **Spotify**.  
5. Если что-то не так → **Сбросить hosts**.

### Portable zip

| Пакет | Архитектура |
|-------|-------------|
| [`Spotify-Discord-Fixer-win-x64.zip`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-win-x64.zip) | Intel / AMD 64-bit |
| [`Spotify-Discord-Fixer-win-x86.zip`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-win-x86.zip) | 32-bit |
| [`Spotify-Discord-Fixer-win-arm64.zip`](https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-win-arm64.zip) | ARM64 |

1. Распакуйте zip.  
2. Запустите **`SpotifyDiscordFixer.exe`**.

**Среда (framework-dependent):** [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) и [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (обычно уже есть на Windows 10/11).

---

## ✨ Возможности

- 🚀 Лучший узел по задержке **TCP :443** или ручной выбор  
- 🎯 Свой **IPv4** + проверка доступности  
- 💾 Бэкап `hosts` в **Загрузки** перед изменениями  
- 👀 Превью блока и текущего состояния hosts  
- 🖥️ Трей, один экземпляр, автозапуск свёрнуто (`--hidden`)  
- 🎨 Светлая / тёмная тема  
- 🔄 Проверка обновлений из приложения  
- 📦 Setup **~2.6 МБ** (вместо ~390 МБ у Electron 1.x)

---

## 🛠️ Сборка из исходников

Нужен **.NET 8 SDK** на Windows.

```powershell
cd SpotifyDiscordFixer
dotnet restore
dotnet build SpotifyDiscordFixer.sln -c Release
dotnet test SpotifyDiscordFixer.sln -c Release
```

```powershell
# UI (Photino + WebView2)
dotnet run --project src\SpotifyDiscordFixer.Ui -c Release
```

### Publish + Setup

```powershell
# publish + Inno Setup (нужен Inno Setup 6)
.\scripts\build-installer.ps1 -Version 2.0.1 -PublishFirst
```

| Слой | Назначение |
|------|------------|
| **Core** | Логика блока hosts, SemVer |
| **Infrastructure** | DNS, TCP, hosts, update |
| **Ui** | Photino + wwwroot |

Выход: `SpotifyDiscordFixer/dist/installers/`, `dist/*.zip`.

---

## 📂 Репозиторий

```
SpotifyDiscordFixer/     ← продукт 2.x (Photino)
docs/                    ← banner, черновики release notes
README.md · CHANGELOG.md · LICENSE
```

---

## 📄 Лицензия

MIT © 2026 [swd3k](https://github.com/swd3k)
