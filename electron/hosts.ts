import { promises as dns } from "node:dns";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import sudo from "sudo-prompt";
import {
  START_MARKER,
  validateIp,
  SPOTIFY_DOMAINS,
  buildBlock,
  extractBlock,
  backupFileName,
  normalizeIpList,
  prepareHostsContent,
  type IpRecord,
  type ParsedBlock,
} from "../shared/hostsBlock";

export {
  START_MARKER,
  END_MARKER,
  SPOTIFY_DOMAINS,
  buildBlock,
  backupFileName,
  formatBackupStamp,
  normalizeIpList,
  prepareHostsContent,
  lineConflictsWithSpotifyDomains,
} from "../shared/hostsBlock";
export type { IpRecord, ParsedBlock } from "../shared/hostsBlock";

// Резервные адреса на случай, если резолв geohide.ru не сработал.
// 95.182.120.241 — узел из ТЗ (S5), должен присутствовать в списке даже при сбое DNS.
const FALLBACK_IPS = ["37.230.192.51", "45.155.204.190", "185.162.248.51", "95.182.120.241"];

/** Единственный целевой hosts (S1): %SystemRoot%\System32\drivers\etc\hosts на Windows. */
export function hostsPath(): string {
  if (process.platform === "win32") {
    const root = process.env.SystemRoot || process.env.windir || "C:\\Windows";
    return path.join(root, "System32", "drivers", "etc", "hosts");
  }
  return "/etc/hosts";
}

/**
 * Каталог бэкапов: папка «Загрузки» (Downloads).
 * НЕ System32\drivers\etc (EPERM). Задаётся из main через app.getPath("downloads").
 */
let backupDirOverride: string | null = null;

export function setHostsBackupDir(dir: string): void {
  backupDirOverride = dir;
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

/** Fallback: USERPROFILE\Downloads или ~/Downloads. */
function defaultDownloadsDir(): string {
  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE || os.homedir();
    return path.join(userProfile, "Downloads");
  }
  return path.join(os.homedir(), "Downloads");
}

export function resolveBackupDir(): string {
  if (backupDirOverride) {
    try {
      fs.mkdirSync(backupDirOverride, { recursive: true });
    } catch {
      /* ignore */
    }
    return backupDirOverride;
  }
  const dir = defaultDownloadsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Простая TCP-проверка доступности узла на :443 с замером задержки.
function tcpPing(ip: string, port = 443, timeout = 3000): Promise<number | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(ok ? Date.now() - start : null);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, ip);
  });
}

// Точечная проверка одного узла (для кнопки «Проверить» и периодической перепроверки).
export async function pingIp(ip: string): Promise<number | null> {
  if (!validateIp(ip)) return null;
  return tcpPing(ip);
}

// Получаем список IP: резолвим geohide.ru, добавляем резерв, дедуплицируем, проверяем доступность.
export async function getIps(): Promise<IpRecord[]> {
  let resolved: string[] = [];
  try {
    resolved = await dns.resolve4("geohide.ru");
  } catch {
    resolved = [];
  }

  const all = Array.from(new Set([...resolved, ...FALLBACK_IPS])).filter((ip) => validateIp(ip));

  const records = await Promise.all(
    all.map(async (ip): Promise<IpRecord> => {
      const latency = await tcpPing(ip);
      return {
        ip,
        status: latency !== null ? "Up" : "Down",
        provider: resolved.includes(ip) ? "GeoHide (geohide.ru)" : "GeoHide (резерв)",
        latency: latency ?? undefined,
      };
    }),
  );

  // Доступные узлы — вперёд, среди доступных — с наименьшей задержкой.
  records.sort((a, b) => {
    if (a.status !== b.status) return a.status === "Up" ? -1 : 1;
    return (a.latency ?? Infinity) - (b.latency ?? Infinity);
  });
  return records;
}

// Статус читаем без повышения прав (hosts обычно доступен на чтение).
export async function getStatus(): Promise<boolean | null> {
  try {
    const content = await fsp.readFile(hostsPath(), "utf-8");
    return content.includes(START_MARKER);
  } catch {
    return null;
  }
}

// Текущий управляемый блок из реального файла hosts (для отображения в приложении).
export async function getActiveBlock(): Promise<ParsedBlock | null> {
  try {
    const content = await fsp.readFile(hostsPath(), "utf-8");
    return extractBlock(content);
  } catch {
    return null;
  }
}

/**
 * Реальная проверка: access(W_OK) на Windows часто врёт.
 * Пробуем открыть hosts на чтение+запись (r+) — только у elevated/root.
 */
export function canWriteHostsDirectly(): boolean {
  const hp = hostsPath();
  try {
    const fd = fs.openSync(hp, "r+");
    fs.closeSync(fd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Бэкап hosts ВСЕГДА в папку «Загрузки» (Downloads).
 * Не пишем рядом с system hosts — там EPERM. Возвращает полный путь к файлу.
 */
export function backupHostsFile(srcPath: string): string {
  const dir = resolveBackupDir();
  fs.mkdirSync(dir, { recursive: true });
  const name = backupFileName();
  let dest = path.join(dir, name);
  let n = 1;
  while (fs.existsSync(dest)) {
    const base = name.replace(/\.txt$/i, "");
    dest = path.join(dir, `${base}_${n}.txt`);
    n += 1;
  }
  // Читаем как буфер — на случай нестандартной кодировки/размера.
  const data = fs.readFileSync(srcPath);
  fs.writeFileSync(dest, data);
  // Проверка: пустой/несозданный файл = ошибка.
  if (!fs.existsSync(dest) || (fs.statSync(dest).size === 0 && data.length > 0)) {
    throw new Error(`Не удалось создать бэкап hosts: ${dest}`);
  }
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("hosts_backup_") && f.endsWith(".txt"))
      .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const old of files.slice(5)) {
      try {
        fs.unlinkSync(path.join(dir, old.f));
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore prune */
  }
  return dest;
}

/**
 * Итоговый hosts готовится в Node (prepareHostsContent) — единая логика:
 * снять managed-блок + при apply чужие Spotify-строки, затем новый блок.
 * Elevated-скрипт только: записать готовый файл в system hosts.
 */
function buildPreparedHosts(action: "apply" | "remove", block = ""): {
  content: string;
  strippedConflicts: number;
  removedManagedBlock: boolean;
} {
  const hp = hostsPath();
  const raw = fs.existsSync(hp) ? fs.readFileSync(hp, "utf-8") : "";
  return prepareHostsContent(raw, action, block);
}

async function flushDns(): Promise<void> {
  if (process.platform !== "win32") return;
  try {
    const { execFile } = await import("node:child_process");
    await new Promise<void>((resolve) => {
      execFile("ipconfig", ["/flushdns"], () => resolve());
    });
  } catch {
    /* ignore */
  }
}

// Elevated: только установка готового hosts (бэкап уже сделан в Node).
const WIN_SCRIPT = `param([string]$ContentFile)
$ErrorActionPreference = "Stop"
$hostsPath = Join-Path $env:SystemRoot "System32\\drivers\\etc\\hosts"
if (-not (Test-Path -LiteralPath $hostsPath)) { throw "System hosts not found: $hostsPath" }
if (-not (Test-Path -LiteralPath $ContentFile)) { throw "Prepared hosts not found: $ContentFile" }
Copy-Item -LiteralPath $ContentFile -Destination $hostsPath -Force
try { ipconfig /flushdns | Out-Null } catch {}
Write-Output "OK"
`;

const UNIX_SCRIPT = `#!/bin/bash
set -e
CONTENT_FILE="$1"
HOSTS="/etc/hosts"
cp "$CONTENT_FILE" "$HOSTS"
chmod 644 "$HOSTS"
( dscacheutil -flushcache 2>/dev/null; killall -HUP mDNSResponder 2>/dev/null ) || true
echo "OK"
`;

function runElevated(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    sudo.exec(command, { name: "Spotify Discord Hosts Fixer" }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(String(stdout || stderr || ""));
    });
  });
}

async function runHostsAction(
  action: "apply" | "remove",
  block = "",
): Promise<{ strippedConflicts: number; backupPath: string }> {
  // 1) Бэкап всегда в Node (hosts читается без admin; запись в Downloads).
  const hp = hostsPath();
  if (!fs.existsSync(hp)) {
    throw new Error(`Файл hosts не найден: ${hp}`);
  }
  const backupPath = backupHostsFile(hp);

  // 2) Готовим содержимое.
  const prepared = buildPreparedHosts(action, block);

  // 3) Пишем system hosts (direct или UAC).
  if (canWriteHostsDirectly()) {
    try {
      fs.writeFileSync(hp, prepared.content, { encoding: "utf-8" });
      await flushDns();
      return { strippedConflicts: prepared.strippedConflicts, backupPath };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/EPERM|EACCES|permission|denied|отказ/i.test(msg)) throw e;
    }
  }

  const tmp = os.tmpdir();
  const isWin = process.platform === "win32";
  const scriptPath = path.join(tmp, isWin ? "spf_hosts_install.ps1" : "spf_hosts_install.sh");
  const contentPath = path.join(tmp, "spf_hosts_prepared.txt");

  fs.writeFileSync(contentPath, prepared.content, "utf-8");
  fs.writeFileSync(scriptPath, isWin ? WIN_SCRIPT : UNIX_SCRIPT, "utf-8");

  let command: string;
  if (isWin) {
    const q = (s: string) => `"${s.replace(/"/g, '`"')}"`;
    command =
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -File ${q(scriptPath)}` +
      ` -ContentFile ${q(contentPath)}`;
  } else {
    command = `/bin/bash "${scriptPath}" "${contentPath}"`;
  }

  await runElevated(command);
  return { strippedConflicts: prepared.strippedConflicts, backupPath };
}

// Проверка после применения: резолвим домен через системный резолвер
// (он читает hosts) и сверяем с записанным IP.
async function verifyRedirect(domain: string, expectedIp: string): Promise<boolean> {
  try {
    const { address } = await dns.lookup(domain, { family: 4 });
    return address === expectedIp;
  } catch {
    return false;
  }
}

export async function applyHosts(ips: unknown): Promise<{ success: boolean; message: string }> {
  const list = normalizeIpList(ips);
  const ip = list[0];
  if (!ip) {
    return { success: false, message: "Нет валидных IP для применения." };
  }
  try {
    const { strippedConflicts, backupPath } = await runHostsAction("apply", buildBlock([ip]));

    const checkDomain = SPOTIFY_DOMAINS[0];
    const verified = await verifyRedirect(checkDomain, ip);
    const verifyNote = verified
      ? `Проверка: ${checkDomain} → ${ip}, перенаправление работает.`
      : `Внимание: проверка ${checkDomain} не подтвердила перенаправление (возможно, нужен сброс кэша DNS).`;
    const stripNote =
      strippedConflicts > 0
        ? ` Удалено старых конфликтующих записей Spotify: ${strippedConflicts}.`
        : "";
    return {
      success: true,
      message:
        `Применён узел ${ip} для ${SPOTIFY_DOMAINS.length} доменов.${stripNote} ` +
        `Бэкап: ${backupPath}. ${verifyNote} Перезапустите Discord и Spotify.`,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Не удалось изменить hosts (отменено или нет прав).";
    return {
      success: false,
      message: `${msg} Запустите программу от имени администратора.`,
    };
  }
}

export async function removeHosts(): Promise<{ success: boolean; message: string }> {
  try {
    const { backupPath } = await runHostsAction("remove");
    return {
      success: true,
      message:
        `Блок #spotify-discord-hosts удалён. Восстановлен стандартный DNS. ` +
        `Бэкап: ${backupPath}. Ручные Spotify-строки вне блока не трогались.`,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Не удалось очистить hosts (отменено или нет прав).";
    return {
      success: false,
      message: `${msg} Запустите программу от имени администратора.`,
    };
  }
}
