<p align="center">
  <img src="docs/banner.png" alt="Spotify Discord Fixer" width="100%">
</p>

<br>

<h1 align="center">Spotify Discord Fixer</h1>

<p align="center">
  Восстанавливает статус Discord «Сейчас слушает Spotify», направляя домены Spotify через прокси (файл hosts).
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
  Разработчик: <a href="https://github.com/swd3k">swd3k</a>
  ·
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases">Релизы</a>
  ·
  <a href="SpotifyDiscordFixer/CHANGELOG.md">История изменений</a>
  ·
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.0-win-x64.exe">
    <img alt="Скачать Setup win-x64" src="https://img.shields.io/badge/⬇%20Скачать-Setup%20win--x64-0969DA?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  &nbsp;
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest">
    <img alt="Все релизы" src="https://img.shields.io/badge/Все%20релизы-gray?style=for-the-badge" />
  </a>
</p>

<p align="center">
  <sub>Актуальная версия: <strong>2.0.0</strong> (Photino, Setup ~2.6 МБ) ·
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest/download/Spotify-Discord-Fixer-Setup-2.0.0-win-x64.exe"><code>Spotify-Discord-Fixer-Setup-2.0.0-win-x64.exe</code></a>
  · portable zip на <a href="https://github.com/swd3k/spotify-discord-fixer/releases">GitHub Releases</a></sub>
</p>

---

> [!NOTE]
> **Неофициальный** инструмент с открытым исходным кодом. Не связан со Spotify, Discord или GeoHide.  
> **Используйте на свой страх и риск.** Для изменения `hosts` потребуются права администратора (UAC).

**v2.0** — лёгкое Windows-приложение (**.NET 8 + Photino / WebView2**, Setup ~2–3 МБ) вместо Electron (~390 МБ).
Помогает вернуть статус «🎧 сейчас слушает Spotify» в Discord: пишет в системный `hosts` блок
с перенаправлением доменов Spotify на прокси GeoHide (или ваш IP).

Исходники: каталог [`SpotifyDiscordFixer/`](SpotifyDiscordFixer/).  
Legacy Electron 1.x убран из `main` (см. историю git и старые теги Releases).

---

> [!CAUTION]
> ### 🚫 ФЕЙКИ
> Я **не веду** никакие другие страницы, группы, Telegram- или YouTube-каналы по этому проекту.  
> **Единственный** официальный источник — **этот репозиторий на GitHub**.  
> Всё, что распространяется от моего имени вне этого репозитория — **ФЕЙК**.

> [!WARNING]
> ### 🛡️ АНТИВИРУСЫ и SmartScreen
> Программа меняет системный файл `hosts` и запрашивает права администратора (UAC). Антивирус или
> Windows SmartScreen могут среагировать на неподписанную сборку.  
> Это **не вирус**: исходный код открыт — изучите его или соберите сами.
>
> Исполняемый файл **не подписан** платным сертификатом, поэтому возможно сообщение
> «Защитник Windows предотвратил запуск». Если доверяете источнику (и сверили загрузку с GitHub Releases) —
> **«Подробнее» → «Выполнить в любом случае»**. При необходимости добавьте папку приложения в исключения.

> [!IMPORTANT]
> ### 🔐 Что важно понимать
> - Берите сборки **только** со страницы [Releases](https://github.com/swd3k/spotify-discord-fixer/releases).  
> - Перенаправляются в том числе домены **авторизации** Spotify — трафик идёт через GeoHide (или ваш IP).  
> - Перед изменением создаётся резервная копия `hosts`; откат — кнопкой **«Сбросить hosts»**.  
> - Не уверены? Соберите программу из исходников (инструкция ниже).  
> - **v2.0 — только Windows.** Для macOS/Linux смотрите старые теги 1.x (Electron).

---

## ⚙️ Что делает приложение

1. Резолвит `geohide.ru`, собирает IP прокси-узлов и проверяет доступность по **TCP :443**.  
2. Позволяет **ввести свой IPv4**, проверить его тем же способом и выбрать для `hosts`.  
3. По **«Обновить и применить»** (если узел выбран — на кнопке показывается его IP) запрашивает UAC,
   **сначала** сохраняет бэкап `hosts_backup_YYYY-MM-DD_HH-mm.txt` в папку **Загрузки**,
   **удаляет** старый блок SDF и **конфликтующие** строки Spotify,
   затем пишет новый блок `#spotify-discord-hosts` … `#end-spotify-discord-hosts`
   **только** в `%SystemRoot%\System32\drivers\etc\hosts`.  
4. В `hosts` попадает **один** узел (выбранный или лучший по задержке). После записи проверяется
   перенаправление; активный узел периодически мониторится.  
5. **«Сбросить hosts»** удаляет блок SDF (ручные Spotify-строки вне блока не трогает); кэш DNS сбрасывается.

---

## 🔒 Безопасность

- Трафик указанных доменов Spotify (включая `accounts.spotify.com`, `login5.spotify.com`) идёт
  через **сторонний** сервис GeoHide или через IP, который вы указали сами.  
- Программа **не** ставит корневые сертификаты и **не** перехватывает TLS сама по себе —
  итоговая безопасность зависит от выбранного прокси.  
- Изменения — только после UAC и (при первом применении) окна-согласия; бэкап + полный откат.  
- Нет телеметрии; логи обновлений (если есть) остаются локально.

---

## 📥 Скачать готовые сборки

Пакеты — на странице **[Releases](https://github.com/swd3k/spotify-discord-fixer/releases)**.

| Пакет | Платформа | Содержимое |
|-------|-----------|------------|
| `Spotify-Discord-Fixer-Setup-2.0.0-win-x64.exe` | Windows x64 | **Установщик** — *большинству пользователей* (~2.6 МБ) |
| `Spotify-Discord-Fixer-Setup-2.0.0-win-x86.exe` | Windows x86 | Установщик |
| `Spotify-Discord-Fixer-Setup-2.0.0-win-arm64.exe` | Windows ARM64 | Установщик |
| `Spotify-Discord-Fixer-win-*.zip` | Windows | Portable |

**Среда выполнения (framework-dependent):** [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) и [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/).

1. Скачайте Setup для своей архитектуры.  
2. Запустите (при применении hosts потребуется UAC).  
3. Обновите список узлов (или введите свой IP) → **Обновить и применить**.  
4. Перезапустите Discord и Spotify.  
5. Если что-то не так → **Сбросить hosts**.

**Автообновление.** Установленная версия (Program Files) может проверять обновления на GitHub Releases.
Portable — обновляйте вручную с Releases.

---

## ✨ Возможности

- 🚀 Автовыбор лучшего прокси по задержке или **ручной выбор** узла  
- 🎯 **Свой IP** — ввод, проверка TCP :443, применение в hosts  
- ✅ Проверка перенаправления после записи + мониторинг активного узла  
- 👀 Предпросмотр блока hosts и просмотр реально установленного  
- 🖥️ Трей, автозапуск вместе с системой (свёрнуто в трей)  
- 🎨 Светлая / тёмная тема  
- ♻️ Ротация резервных копий hosts (последние 5)  
- 📦 Лёгкий Setup Windows (~2.6 МБ) + portable zip  
- 🔄 Проверка обновлений из приложения  

---

## 🛠️ Сборка из исходников (2.0)

Нужны **.NET 8 SDK** и (для Setup) **Inno Setup 6**.

```powershell
cd SpotifyDiscordFixer
dotnet test -c Release
dotnet run --project src\SpotifyDiscordFixer.Ui -c Release

# portable + Setup для всех архитектур
.\scripts\build-installer.ps1 -Version 2.0.0 -PublishFirst
```

Артефакты: `SpotifyDiscordFixer/dist/`.

## 👨‍💻 Для разработки

```powershell
cd SpotifyDiscordFixer
dotnet test
dotnet run --project src\SpotifyDiscordFixer.Ui -c Debug
```

| Слой | Назначение |
|------|------------|
| `SpotifyDiscordFixer.Core` | Логика блока hosts (без I/O) |
| `SpotifyDiscordFixer.Infrastructure` | DNS, TCP, hosts, обновления |
| `SpotifyDiscordFixer.Ui` | Photino + `wwwroot` |

---

## 📂 Структура репозитория

```
├── SpotifyDiscordFixer/     # v2.0 — .NET 8 + Photino
│   ├── src/                 # Core, Infrastructure, Ui
│   ├── tests/
│   ├── scripts/             # publish + Inno
│   ├── installer/
│   └── CHANGELOG.md
├── docs/                    # banner
├── .github/workflows/       # CI: dotnet test + релиз Setup
├── CHANGELOG.md             # указатель + архив 1.x
├── LICENSE
└── README.md
```

Исходники Electron 1.x удалены из `main` (история в git и билды на старых тегах Releases).

---

## 📄 Лицензия

MIT © 2026 [swd3k](https://github.com/swd3k)
