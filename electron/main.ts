import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import fs from "node:fs";
import { getIps, getStatus, applyHosts, removeHosts, buildBlock, getActiveBlock, pingIp, type DomainMode } from "./hosts";

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
      return saved;
    }
  } catch {
    // Нет сохранённого состояния — используем размеры по умолчанию.
  }
  return { width: 560, height: 880 };
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
    minWidth: 540,
    minHeight: 700,
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
      sandbox: false,
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

  if (showOnReady) {
    win.once("ready-to-show", () => win.show());
  }

  // Закрытие окна сворачивает в трей, а не завершает программу.
  win.on("close", (e) => {
    saveWindowState(win);
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
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
  let image = nativeImage.createFromPath(assetPath("tray.png"));
  if (!image.isEmpty()) {
    image = image.resize({ width: 16, height: 16 });
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

// Автопроверка обновлений через GitHub Releases (только для установленной версии;
// portable-сборка не обновляется сама — ошибки глушим).
function setupAutoUpdater() {
  if (!app.isPackaged) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { autoUpdater } = require("electron-updater");
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  } catch {
    // electron-updater недоступен (например, в dev-сборке) — пропускаем.
  }
}

const normalizeMode = (mode: unknown): DomainMode => (mode === "minimal" ? "minimal" : "full");

// IPC: данные и операции
ipcMain.handle("get-ips", async () => getIps());
ipcMain.handle("get-status", async () => getStatus());
ipcMain.handle("get-active-block", async () => getActiveBlock());
ipcMain.handle("ping-ip", async (_e, ip: string) => pingIp(String(ip || "")));
ipcMain.handle("get-block-text", async (_e, ips: string[], mode?: string) => buildBlock(ips || [], normalizeMode(mode)));
ipcMain.handle("apply", async (_e, ips: string[], mode?: string) => applyHosts(ips || [], normalizeMode(mode)));
ipcMain.handle("remove", async () => removeHosts());

// IPC: автозапуск вместе с системой (свёрнуто в трей).
// На Windows args нужно передавать и при чтении, иначе запись в реестре не сматчится.
const AUTOSTART_ARGS = ["--hidden"];
ipcMain.handle("get-autostart", () => app.getLoginItemSettings({ args: AUTOSTART_ARGS }).openAtLogin);
ipcMain.handle("set-autostart", (_e, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: Boolean(enabled), args: AUTOSTART_ARGS });
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
