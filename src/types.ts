// Чистая логика и базовые типы живут в shared/hostsBlock.ts —
// общие для main-процесса и рендерера.
import type { IpRecord, ParsedBlock as ActiveBlock } from "../shared/hostsBlock";

export type { IpRecord, ActiveBlock };

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export interface ApplyResult {
  success: boolean;
  message: string;
}

// API, прокинутое из preload через contextBridge
export interface FixerApi {
  getIps: () => Promise<IpRecord[]>;
  getStatus: () => Promise<boolean | null>;
  getActiveBlock: () => Promise<ActiveBlock | null>;
  pingIp: (ip: string) => Promise<number | null>;
  getBlockText: (ips: string[]) => Promise<string>;
  apply: (ips: string[]) => Promise<ApplyResult>;
  remove: () => Promise<ApplyResult>;
  getAutostart: () => Promise<boolean>;
  setAutostart: (enabled: boolean) => Promise<boolean>;
  getHostsMeta: () => Promise<{ path: string; elevated: boolean; backupDir: string }>;
  onTrayMinimized: (cb: () => void) => () => void;
}

declare global {
  interface Window {
    api: FixerApi;
  }
  // Версия приложения, подставляется Vite из package.json (см. vite.config.ts).
  const __APP_VERSION__: string;
}
