// Чистая логика формирования и разбора управляемого блока hosts.
// Вынесена из hosts.ts, чтобы её можно было покрыть тестами без Electron и системных вызовов.

export const START_MARKER = "#spotify-discord-hosts";
export const END_MARKER = "#end-spotify-discord-hosts";

// Домены Spotify, которые перенаправляются на прокси-узлы GeoHide.
// S8: i.scdn.co, spotifycdn.com — CDN/статика, нужны для стабильного презенса.
export const SPOTIFY_DOMAINS = [
  "api.spotify.com",
  "login5.spotify.com",
  "encore.scdn.co",
  "i.scdn.co",
  "gew1-spclient.spotify.com",
  "spclient.wg.spotify.com",
  "api-partner.spotify.com",
  "aet.spotify.com",
  "www.spotify.com",
  "accounts.spotify.com",
  "open.spotify.com",
  "accounts.scdn.co",
  "gew1-dealer.spotify.com",
  "open-exp.spotifycdn.com",
  "spotifycdn.com",
  "www-growth.scdn.co",
];

// Строгий шаблон IPv4: каждый октет обязан быть в диапазоне 0–255.
// (Прежний宽松-вариант \d{1,3} пропускал значения вроде 999.999.999.999.)
export const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

// Явная проверка одного адреса — единая точка валидации для main-процесса и рендерера.
export function validateIp(ip: unknown): ip is string {
  return typeof ip === "string" && IPV4_RE.test(ip);
}

/** Имя бэкапа: hosts_backup_YYYY-MM-DD_HH-mm (без секунд). */
export function formatBackupStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

export function backupFileName(d = new Date()): string {
  // .txt — чтобы файл был заметен в проводнике и не путался с system hosts.
  return `hosts_backup_${formatBackupStamp(d)}.txt`;
}

/**
 * S4: строго валидные IP-строки.
 * object/null/array-элементы отбрасываются (регрессия util.isObject).
 */
export function normalizeIpList(ips: unknown): string[] {
  if (ips == null) return [];
  if (typeof ips === "string") return validateIp(ips) ? [ips] : [];
  if (!Array.isArray(ips)) return [];
  const out: string[] = [];
  for (const item of ips) {
    if (typeof item === "string" && validateIp(item)) out.push(item);
    else if (item && typeof item === "object" && "ip" in (item as object)) {
      const nested = (item as { ip?: unknown }).ip;
      if (typeof nested === "string" && validateIp(nested)) out.push(nested);
    }
  }
  return out;
}

export interface IpRecord {
  ip: string;
  status: "Up" | "Down";
  provider: string;
  latency?: number;
}

// Один лучший узел: система всё равно использует только первую запись hosts
// для домена, поэтому остальные IP лежали бы мёртвым грузом.
export function pickBestIp(records: IpRecord[]): string | null {
  const up = records.filter((r) => r.status === "Up" && IPV4_RE.test(r.ip));
  if (up.length === 0) return null;
  up.sort((a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity));
  return up[0].ip;
}

// Блок строится для одного (лучшего) IP — первого валидного в списке.
export function buildBlock(ips: string[]): string {
  const ip = ips.find((candidate) => IPV4_RE.test(candidate));
  const lines = [START_MARKER];
  if (ip) {
    for (const domain of SPOTIFY_DOMAINS) {
      lines.push(`${ip} ${domain}`);
    }
  }
  lines.push(END_MARKER);
  return lines.join("\n");
}

export interface ParsedBlock {
  ip: string | null;
  domains: string[];
  text: string;
}

// Извлекает управляемый блок из содержимого hosts; null, если блока нет.
export function extractBlock(hostsContent: string): ParsedBlock | null {
  const lines = hostsContent.split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes(START_MARKER));
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && l.includes(END_MARKER));
  const body = lines.slice(start + 1, end === -1 ? undefined : end);

  let ip: string | null = null;
  const domains: string[] = [];
  for (const line of body) {
    const m = line.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(\S+)/);
    if (!m) continue;
    if (!ip) ip = m[1];
    domains.push(m[2]);
  }

  const text = [START_MARKER, ...body, END_MARKER].join("\n");
  return { ip, domains, text };
}

const DOMAIN_SET = () => new Set(SPOTIFY_DOMAINS.map((d) => d.toLowerCase()));

/**
 * Строка hosts конфликтует с нашими доменами Spotify?
 * hosts берёт ПЕРВУЮ запись по имени — чужой IP выше нашего блока ломает Apply.
 * Комментарии (# …) не трогаем.
 */
export function lineConflictsWithSpotifyDomains(
  line: string,
  domains: ReadonlySet<string> = DOMAIN_SET(),
): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  // inline-комментарий: "1.1.1.1 host # note"
  const code = trimmed.split("#")[0].trim();
  if (!code) return false;
  const parts = code.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  // parts[0] — IP (или hostname-алиас); остальные — имена
  for (let i = 1; i < parts.length; i++) {
    if (domains.has(parts[i].toLowerCase())) return true;
  }
  return false;
}

export interface PrepareHostsResult {
  content: string;
  /** Сколько «чужих» Spotify-строк снято вне нашего блока. */
  strippedConflicts: number;
  /** Был ли удалён предыдущий managed-блок. */
  removedManagedBlock: boolean;
}

/**
 * Готовит итоговое содержимое hosts:
 * 1) убрать managed-блок #spotify-discord-hosts … #end-…
 * 2) при apply — убрать любые строки с доменами из SPOTIFY_DOMAINS (старые ручные IP)
 * 3) при apply — дописать новый блок
 * 4) при remove — только шаг 1 (чужие Spotify-строки не трогаем на «Сбросить»)
 */
export function prepareHostsContent(
  hostsContent: string,
  action: "apply" | "remove",
  block = "",
): PrepareHostsResult {
  const domains = DOMAIN_SET();
  const lines = hostsContent.split(/\r?\n/);
  const out: string[] = [];
  let skip = false;
  let removedManagedBlock = false;
  let strippedConflicts = 0;

  for (const line of lines) {
    if (line.includes(START_MARKER)) {
      skip = true;
      removedManagedBlock = true;
      continue;
    }
    if (line.includes(END_MARKER)) {
      skip = false;
      continue;
    }
    if (skip) continue;

    if (action === "apply" && lineConflictsWithSpotifyDomains(line, domains)) {
      strippedConflicts += 1;
      continue;
    }
    out.push(line);
  }

  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();

  if (action === "apply" && block.trim()) {
    out.push("");
    out.push(...block.trimEnd().split(/\r?\n/));
  }

  return {
    content: out.join("\n").replace(/\n*$/, "\n"),
    strippedConflicts,
    removedManagedBlock,
  };
}
