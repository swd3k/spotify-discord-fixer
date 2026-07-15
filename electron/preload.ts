import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  getIps: () => ipcRenderer.invoke("get-ips"),
  getStatus: () => ipcRenderer.invoke("get-status"),
  getActiveBlock: () => ipcRenderer.invoke("get-active-block"),
  pingIp: (ip: string) => ipcRenderer.invoke("ping-ip", ip),
  getBlockText: (ips: string[]) => ipcRenderer.invoke("get-block-text", ips),
  apply: (ips: string[]) => ipcRenderer.invoke("apply", ips),
  remove: () => ipcRenderer.invoke("remove"),
  getAutostart: () => ipcRenderer.invoke("get-autostart"),
  setAutostart: (enabled: boolean) => ipcRenderer.invoke("set-autostart", enabled),
  getHostsMeta: () => ipcRenderer.invoke("get-hosts-meta"),
  // Односторонние события от main-процесса.
  onTrayMinimized: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on("tray-minimized", listener);
    // Возврат функции отписки — чтобы рендерер мог очистить слушатель.
    return () => ipcRenderer.removeListener("tray-minimized", listener);
  },
});
