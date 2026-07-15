import { app, BrowserWindow, dialog, ipcMain, shell, Tray, Menu, nativeImage, screen } from "electron";
import path from "node:path";
import fs from "node:fs";
import {
  getIps,
  getStatus,
  applyHosts,
  removeHosts,
  buildBlock,
  getActiveBlock,
  pingIp,
  canWriteHostsDirectly,
  hostsPath,
  setHostsBackupDir,
  resolveBackupDir,
} from "./hosts";
import { normalizeIpList } from "../shared/hostsBlock";

// S4: единая нормализация IPC → валидные IPv4 (object/null не проходят).
function asIpArray(value: unknown): string[] {
  return normalizeIpList(value);
}

const isDev = !app.isPackaged && process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// При автозапуске стартуем свёрнутыми в трей.
const startHidden = process.argv.includes("--hidden");

// Ассеты (иконки) копируются в dist/electron при сборке — см. скрипт copy:assets.
const assetPath = (file: string) => path.join(__dirname, file);

// Размер и позиция окна сохраняются между запусками.
interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

const windowStatePath = () => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState(): WindowState {
  try {
    const saved = JSON.parse(fs.readFileSync(windowStatePath(), "utf-8"));
    if (typeof saved.width === "number" && typeof saved.height === "number") {
      // Сбрасываем позицию, если сохранённое окно оказалось за пределами всех
      // доступных дисплеев (например, монитор отключили/сменили).
      if (saved.x !== undefined && saved.y !== undefined) {
        const displays = screen.getAllDisplays();
        const onScreen = displays.some((d) => {
          const { x, y, width, height } = d.bounds;
          // Хватаемся за левый-верхний угол: если он в каком-то дисплее — оставляем.
          return saved.x! >= x && saved.x! < x + width && saved.y! >= y && saved.y! < y + height;
        });
        if (!onScreen) {
          saved.x = undefined;
          saved.y = undefined;
        }
      }
      return saved;
    }
  } catch {
    // Нет сохранённого состояния — используем размеры по умолчанию.
  }
  return { width: 1080, height: 720 };
}

function saveWindowState(win: BrowserWindow) {
  try {
    if (win.isMinimized() || win.isMaximized()) return;
    fs.writeFileSync(windowStatePath(), JSON.stringify(win.getBounds()), "utf-8");
  } catch {
    // Не удалось сохранить — не критично.
  }
}

function createWindow(showOnReady = true) {
  const state = loadWindowState();
  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 620,
    resizable: true,
    show: false,
    icon: assetPath("icon.png"),
    title: "Spotify Discord Hosts Fixer",
    autoHideMenuBar: true,
    // Полупрозрачный системный фон: acrylic на Windows 11, vibrancy на macOS.
    backgroundColor: "#00000000",
    backgroundMaterial: "acrylic",
    vibrancy: "under-window",
    webPreferences: {
      preload: assetPath("preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Песочница включена: preload использует только contextBridge + ipcRenderer.invoke,
      // поэтому Node-API в рендерере не нужен. Снижает радиус поражения при XSS.
      sandbox: true,
    },
  });

  mainWindow = win;

  // Внешние ссылки открываем в системном браузере, а не в окне приложения.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Запрещаем рендереру самовольно уходить с текущего источника (file:// в проде,
  // dev-сервер при разработке) — защита от навигации на произвольный URL при XSS.
  win.webContents.on("will-navigate", (e, url) => {
    const allowed = isDev ? (process.env.VITE_DEV_SERVER_URL as string) : undefined;
    if (allowed ? !url.startsWith(allowed) : true) {
      e.preventDefault();
    }
  });
  // На всякий случай: те же правила для открытия в новом окне/вкладке.
  win.webContents.on("will-attach-webview", (e) => e.preventDefault());

  if (showOnReady) {
    win.once("ready-to-show", () => win.show());
  }

  // Закрытие окна сворачивает в трей, а не завершает программу.
  win.on("close", (e) => {
    saveWindowState(win);
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
      // Сигнал рендереру: окно ушло в трей (используется для одноразовой подсказки).
      win.webContents.send("tray-minimized");
    }
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }
}

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function createTray() {
  // 16×16 tray slot: scale from high-res tray asset with quality so glyph fills the cell.
  let image = nativeImage.createFromPath(assetPath("tray.png"));
  if (image.isEmpty()) {
    image = nativeImage.createFromPath(assetPath("icon.png"));
  }
  if (!image.isEmpty()) {
    // Prefer crisp 16×16; quality option keeps edges when downscaling larger sources.
    image = image.resize({ width: 16, height: 16, quality: "best" });
  }
  tray = new Tray(image);
  tray.setToolTip("Spotify Discord Hosts Fixer");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Открыть", click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: "Скрыть в трей", click: () => mainWindow?.hide() },
    { type: "separator" },
    { label: "Выход", click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);

  // ЛКМ по значку в трее — показать/скрыть окно.
  tray.on("click", () => toggleWindow());
}

// Проблемы обновления невидимы для пользователя, поэтому пишем их в файл.
// Приложение живёт в трее неделями, поэтому ограничиваем размер лога —
// если он превышает лимит, оставляем только последнюю половину.
const UPDATER_LOG_MAX_BYTES = 256 * 1024;

function logUpdater(line: string) {
  try {
    const logPath = path.join(app.getPath("userData"), "updater.log");
    try {
      const { size } = fs.statSync(logPath);
      if (size > UPDATER_LOG_MAX_BYTES) {
        // Оставляем вторую половину файла — старые записи отбрасываем.
        const buf = fs.readFileSync(logPath);
        const half = buf.slice(Math.floor(buf.length / 2));
        const newlineIdx = half.indexOf(0x0a); // обрезаем до конца первой неполной строки
        fs.writeFileSync(logPath, newlineIdx >= 0 ? half.slice(newlineIdx + 1) : half);
      }
    } catch {
      // Файла ещё нет или не удалось прочитать — просто пишем дальше.
    }
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${line}\n`);
  } catch {
    // Не удалось записать лог — не критично.
  }
}

// Автопроверка обновлений через GitHub Releases (только для установленной версии;
// portable-сборка не обновляется сама). Когда обновление скачано — явный диалог,
// а не системное уведомление, которое легко не заметить.
function setupAutoUpdater() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ autoUpdater } = require("electron-updater"));
  } catch {
    // electron-updater недоступен (например, в dev-сборке) — пропускаем.
    return;
  }

  autoUpdater.on("error", (e: Error) => logUpdater(`error: ${e?.message || e}`));
  autoUpdater.on("update-available", (info: { version?: string }) => logUpdater(`update-available: ${info?.version}`));
  autoUpdater.on("update-not-available", () => logUpdater("update-not-available"));
  autoUpdater.on("update-downloaded", (info: { version?: string }) => {
    logUpdater(`update-downloaded: ${info?.version}`);
    const updater = autoUpdater;
    dialog
      .showMessageBox({
        type: "info",
        title: "Доступно обновление",
        message: `Скачана новая версия ${info?.version || ""}.`.trim(),
        detail: "Установить сейчас? Программа перезапустится. Если выбрать «Позже», обновление установится при выходе из программы.",
        buttons: ["Установить и перезапустить", "Позже"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          isQuitting = true;
          updater.quitAndInstall();
        }
      });
  });

  const check = () => autoUpdater.checkForUpdates().catch((e: Error) => logUpdater(`check failed: ${e?.message || e}`));
  check();
  // Приложение живёт в трее неделями — перепроверяем периодически, а не только на старте.
  setInterval(check, 4 * 60 * 60 * 1000);
}

// IPC: данные и операции.
// Аргументы из рендерера валидируются во время исполнения — даже при contextIsolation
// это страховка от неожиданных типов (массив вместо строки, объект и т.п.).
ipcMain.handle("get-ips", async () => getIps());
ipcMain.handle("get-status", async () => getStatus());
ipcMain.handle("get-active-block", async () => getActiveBlock());
ipcMain.handle("ping-ip", async (_e, ip: unknown) => {
  // S4: только строка-IP; object/array → null без crash.
  if (typeof ip !== "string") return null;
  return pingIp(ip);
});
ipcMain.handle("get-block-text", async (_e, ips: unknown) => buildBlock(asIpArray(ips)));
ipcMain.handle("apply", async (_e, ips: unknown) => applyHosts(ips));
ipcMain.handle("remove", async () => removeHosts());
ipcMain.handle("get-hosts-meta", async () => ({
  path: hostsPath(),
  elevated: canWriteHostsDirectly(),
  backupDir: resolveBackupDir(),
}));

// IPC: автозапуск вместе с системой (свёрнуто в трей).
// На Windows args нужно передавать и при чтении, иначе запись в реестре не сматчится.
const AUTOSTART_ARGS = ["--hidden"];
ipcMain.handle("get-autostart", () => app.getLoginItemSettings({ args: AUTOSTART_ARGS }).openAtLogin);
ipcMain.handle("set-autostart", (_e, enabled: unknown) => {
  app.setLoginItemSettings({ openAtLogin: enabled === true, args: AUTOSTART_ARGS });
  return app.getLoginItemSettings({ args: AUTOSTART_ARGS }).openAtLogin;
});

// Один экземпляр приложения: повторный запуск разворачивает уже открытое окно.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  app.whenReady().then(() => {
    // Бэкапы hosts → папка «Загрузки» (Downloads).
    setHostsBackupDir(app.getPath("downloads"));
    // Нужен для корректных уведомлений и группировки в панели задач Windows.
    app.setAppUserModelId("com.geohide.spotify-discord-hosts-fixer");
    // Убираем стандартное системное меню (File/Edit/View/Window/Help).
    Menu.setApplicationMenu(null);
    createWindow(!startHidden);
    createTray();
    setupAutoUpdater();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else mainWindow?.show();
    });
  });
}

app.on("before-quit", () => {
  isQuitting = true;
});

// Окно прячется в трей, поэтому само по себе не закрывается;
// выход выполняется только через пункт «Выход» в трее.
app.on("window-all-closed", () => {
  // Намеренно пусто: приложение продолжает жить в трее.
});
