// Чистая логика формирования и разбора управляемого блока hosts.
// Вынесена из hosts.ts, чтобы её можно было покрыть тестами без Electron и системных вызовов.

export const START_MARKER = "#spotify-discord-hosts";
export const END_MARKER = "#end-spotify-discord-hosts";

// Домены Spotify, которые перенаправляются на прокси-узлы GeoHide.
export const SPOTIFY_DOMAINS = [
  "api.spotify.com",
  "login5.spotify.com",
  "encore.scdn.co",
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
  "www-growth.scdn.co",
];

export const IPV4_RE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

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
