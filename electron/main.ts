import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { getIps, getStatus, applyHosts, removeHosts, buildBlock } from "./hosts";

const isDev = !app.isPackaged && process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 560,
    height: 880,
    resizable: true,
    backgroundColor: "#0c0c0c",
    title: "Spotify Discord Hosts Fixer",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Внешние ссылки открываем в системном браузере, а не в окне приложения.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }
}

// IPC: данные и операции
ipcMain.handle("get-ips", async () => getIps());
ipcMain.handle("get-status", async () => getStatus());
ipcMain.handle("get-block-text", async (_e, ips: string[]) => buildBlock(ips || []));
ipcMain.handle("apply", async (_e, ips: string[]) => applyHosts(ips || []));
ipcMain.handle("remove", async () => removeHosts());

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
