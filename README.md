<p align="center">
  <img src="docs/banner.png" alt="Spotify Discord Hosts Fixer" width="100%">
</p>

<br>

<h1 align="center">Spotify Discord Fixer</h1>

<p align="center">
  Восстанавливает статус «сейчас слушает Spotify» в Discord, перенаправляя домены Spotify через прокси в системном hosts.
</p>

<p align="center">
  <a href="https://github.com/swd3k/spotify-discord-fixer/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/swd3k/spotify-discord-fixer/ci.yml?branch=main&style=flat-square&label=CI" /></a>
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases/latest"><img alt="version" src="https://img.shields.io/github/v/release/swd3k/spotify-discord-fixer?style=flat-square&label=version" /></a>
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" />
  <img alt="status" src="https://img.shields.io/badge/status-release-brightgreen?style=flat-square" />
  <a href="https://github.com/swd3k"><img alt="author" src="https://img.shields.io/badge/author-swd3k-24292e?style=flat-square&logo=github&logoColor=white" /></a>
  <img alt="Electron" src="https://img.shields.io/badge/Electron-43-47848F?style=flat-square&logo=electron&logoColor=white" />
</p>

<p align="center">
  Developer: <a href="https://github.com/swd3k">swd3k</a>
  ·
  <a href="https://github.com/swd3k/spotify-discord-fixer/releases">Releases</a>
  ·
  <a href="LICENSE">MIT</a>
</p>

---

> [!NOTE]
> **Неофициальный** инструмент с открытым исходным кодом. Не связан со Spotify, Discord или GeoHide.  
> **Используйте на свой страх и риск.** Для изменения `hosts` потребуются права администратора (UAC).

Десктоп-приложение для **Windows / macOS / Linux**, которое помогает вернуть статус
«🎧 сейчас слушает Spotify» в Discord, когда домены Spotify недоступны или медленные на вашем канале.
Программа пишет в системный `hosts` блок, перенаправляющий домены Spotify на прокси-узлы GeoHide
(или на IP, который вы укажете сами).

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

---

## ⚙️ Что делает приложение

1. Резолвит `geohide.ru`, собирает IP прокси-узлов и проверяет доступность по **TCP :443**.  
2. Позволяет **ввести свой IPv4**, проверить его тем же способом и выбрать для `hosts`.  
3. По **«Обновить и применить»** (если узел выбран — на кнопке показывается его IP) запрашивает UAC,
   **сначала** сохраняет бэкап `hosts_backup_YYYY-MM-DD_HH-mm.txt` в папку **Загрузки** (путь в сообщении об успехе),
   **удаляет** старый блок SDF и **конфликтующие** строки Spotify (hosts берёт только **первую** запись по имени),
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
| `Spotify-Discord-Hosts-Fixer-Setup-*-win-x64.exe` | Windows x64 | Установщик NSIS — *большинству пользователей* |
| `Spotify-Discord-Hosts-Fixer-*-win-x64-portable.exe` | Windows x64 | Portable, без установки |
| `Spotify-Discord-Hosts-Fixer-*-win-arm64*` | Windows ARM64 | Setup / portable |
| `Spotify-Discord-Hosts-Fixer-*-linux-*.AppImage` | Linux | AppImage |
| `Spotify-Discord-Hosts-Fixer-*-linux-*.deb` | Linux (Debian/Ubuntu) | Пакет `.deb` |
| `Spotify-Discord-Hosts-Fixer-*-mac-*.dmg` | macOS | Диск-образ |
| `Spotify-Discord-Hosts-Fixer-*-mac-*.zip` | macOS | Архив `.app` |

1. Скачайте файл для своей ОС и архитектуры.  
2. Запустите (на Windows — при применении потребуется UAC).  
3. Обновите список узлов (или введите свой IP) → **Обновить и применить**.  
4. Перезапустите Discord и Spotify.  
5. Если что-то не так → **Сбросить hosts**.

**Проверка целостности.** К релизу прилагается `SHA256SUMS.txt`:

```powershell
Get-FileHash .\Spotify*.exe -Algorithm SHA256
```

```bash
sha256sum -c SHA256SUMS.txt
```

**Автообновление.** Установленная Windows-версия (NSIS) может проверять обновления на GitHub Releases.
Portable и сборки Linux/macOS — обновляйте вручную с Releases.

---

## ✨ Возможности

- 🚀 Автовыбор лучшего прокси по задержке или **ручной выбор** узла  
- 🎯 **Свой IP** — ввод, проверка TCP :443, применение в hosts  
- ✅ Проверка перенаправления после записи + мониторинг активного узла  
- 👀 Предпросмотр блока hosts и просмотр реально установленного  
- 🖥️ Трей, автозапуск вместе с системой (свёрнуто в трей)  
- 🎨 Светлая / тёмная тема, сохранение размера и позиции окна  
- ♻️ Ротация резервных копий hosts (последние 5)  
- 📦 Сборки Windows / Linux / macOS

---

## 🛠️ Сборка из исходников

Нужен **Node.js 20+**.

```bash
npm install
npm run typecheck
npm test
npm run build
```

### Релизные пакеты

```bash
# Только текущая ОС (по умолчанию — Windows-таргеты из package.json)
npm run dist

# Windows: Setup + portable, x64 и arm64
npm run dist:win

# Linux: AppImage + deb
npm run dist:linux

# macOS: dmg + zip  (нужен macOS / runner)
npm run dist:mac

# Все платформы сразу (на практике — на соответствующей ОС / в CI)
npm run dist:all
```

Артефакты появятся в папке `release/`.

CI на каждый push в `main` и PR гоняет typecheck / lint / tests / build.
По тегу `v*` (например `v1.0.0`) собираются Windows, Linux и macOS и публикуется GitHub Release.

---

## 👨‍💻 Для разработки

```bash
npm install
npm run dev:renderer   # Vite — интерфейс
npm run typecheck
npm run lint
npm test               # vitest — логика hosts
```

Основной процесс Electron: `electron/`. UI: `src/` (React). Общая логика блока hosts: `shared/`.

---

## 📂 Структура репозитория

```
├── electron/            # main, preload, работа с hosts
├── src/                 # React UI
│   └── components/      # IPList, CustomIp, предпросмотр, логи
├── shared/              # buildBlock / validateIp / тесты
├── build/               # иконки для electron-builder
├── docs/                # баннер и картинки для README
├── .github/workflows/   # CI + multi-OS release
├── package.json
├── LICENSE
└── README.md
```

---

## 🌍 Обрабатываемые домены

```
api.spotify.com
login5.spotify.com
encore.scdn.co
gew1-spclient.spotify.com
spclient.wg.spotify.com
api-partner.spotify.com
aet.spotify.com
www.spotify.com
accounts.spotify.com
open.spotify.com
accounts.scdn.co
gew1-dealer.spotify.com
open-exp.spotifycdn.com
www-growth.scdn.co
```

---

## 🔗 Полезные ссылки

- 💻 Исходный код — https://github.com/swd3k/spotify-discord-fixer  
- 📦 Releases — https://github.com/swd3k/spotify-discord-fixer/releases  
- 🌐 GeoHide DNS — https://dns.geohide.ru:8443/  
- 🎶 SpotX — https://github.com/SpotX-Official/SpotX  

---

## ⚖️ Отказ от ответственности

Инструмент для восстановления штатной работы **легально** используемых сервисов.
Изменение системного `hosts` — **на ваш страх и риск**. Резервная копия создаётся, но полная
гарантия восстановления на любой конфигурации ОС не даётся.

Автор (**swd3k**) не несёт ответственности за нестабильность, потерю данных или иные последствия.

---

## 🧩 Стек

`Electron` · `React` · `TypeScript` · `Vite` · `Tailwind CSS` · `electron-builder` · `electron-updater` · `Vitest`

---

## 📄 Лицензия

[MIT](./LICENSE) © 2026 [swd3k](https://github.com/swd3k)
