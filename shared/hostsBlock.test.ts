import { describe, it, expect } from "vitest";
import {
  START_MARKER,
  END_MARKER,
  SPOTIFY_DOMAINS,
  buildBlock,
  extractBlock,
  pickBestIp,
  validateIp,
  backupFileName,
  formatBackupStamp,
  normalizeIpList,
  lineConflictsWithSpotifyDomains,
  prepareHostsContent,
  type IpRecord,
} from "./hostsBlock";

describe("buildBlock", () => {
  it("строит блок для одного (первого валидного) IP", () => {
    const block = buildBlock(["1.2.3.4", "5.6.7.8"]);
    const lines = block.split("\n");
    expect(lines[0]).toBe(START_MARKER);
    expect(lines[lines.length - 1]).toBe(END_MARKER);
    expect(lines).toHaveLength(SPOTIFY_DOMAINS.length + 2);
    expect(block).toContain("1.2.3.4 api.spotify.com");
    expect(block).not.toContain("5.6.7.8");
  });

  it("пропускает невалидные IP и берёт первый валидный", () => {
    const block = buildBlock(["not-an-ip", "evil; rm -rf /", "9.9.9.9"]);
    expect(block).toContain("9.9.9.9 api.spotify.com");
    expect(block).not.toContain("not-an-ip");
    expect(block).not.toContain("evil");
  });

  it("без валидных IP возвращает пустой блок (только маркеры)", () => {
    expect(buildBlock([])).toBe(`${START_MARKER}\n${END_MARKER}`);
    expect(buildBlock(["nope"])).toBe(`${START_MARKER}\n${END_MARKER}`);
  });
});

describe("extractBlock", () => {
  it("возвращает null, если блока нет", () => {
    expect(extractBlock("127.0.0.1 localhost\n")).toBeNull();
  });

  it("разбирает блок, построенный buildBlock (roundtrip)", () => {
    const block = buildBlock(["1.2.3.4"]);
    const hosts = `127.0.0.1 localhost\n\n${block}\n`;
    const parsed = extractBlock(hosts);
    expect(parsed).not.toBeNull();
    expect(parsed!.ip).toBe("1.2.3.4");
    expect(parsed!.domains).toEqual(SPOTIFY_DOMAINS);
    expect(parsed!.text).toBe(block);
  });

  it("переживает CRLF и посторонние строки внутри блока", () => {
    const hosts = `# comment\r\n${START_MARKER}\r\n1.2.3.4 api.spotify.com\r\nне строка hosts\r\n${END_MARKER}\r\n`;
    const parsed = extractBlock(hosts);
    expect(parsed!.ip).toBe("1.2.3.4");
    expect(parsed!.domains).toEqual(["api.spotify.com"]);
  });

  it("не падает на блоке без закрывающего маркера", () => {
    const hosts = `${START_MARKER}\n1.2.3.4 api.spotify.com\n`;
    const parsed = extractBlock(hosts);
    expect(parsed!.ip).toBe("1.2.3.4");
  });
});

describe("pickBestIp", () => {
  const rec = (ip: string, status: "Up" | "Down", latency?: number): IpRecord => ({
    ip,
    status,
    provider: "test",
    latency,
  });

  it("выбирает доступный узел с наименьшей задержкой", () => {
    const best = pickBestIp([rec("1.1.1.1", "Up", 80), rec("2.2.2.2", "Up", 20), rec("3.3.3.3", "Down")]);
    expect(best).toBe("2.2.2.2");
  });

  it("игнорирует недоступные узлы и возвращает null, если все Down", () => {
    expect(pickBestIp([rec("1.1.1.1", "Down"), rec("2.2.2.2", "Down")])).toBeNull();
    expect(pickBestIp([])).toBeNull();
  });

  it("узел без замера задержки проигрывает узлу с замером", () => {
    const best = pickBestIp([rec("1.1.1.1", "Up"), rec("2.2.2.2", "Up", 500)]);
    expect(best).toBe("2.2.2.2");
  });
});

describe("SPOTIFY_DOMAINS", () => {
  it("включает CDN-домены i.scdn.co и spotifycdn.com (S8)", () => {
    expect(SPOTIFY_DOMAINS).toContain("i.scdn.co");
    expect(SPOTIFY_DOMAINS).toContain("spotifycdn.com");
  });
});

describe("backupFileName", () => {
  it("формат hosts_backup_YYYY-MM-DD_HH-mm.txt без секунд (S2)", () => {
    const d = new Date(2026, 6, 15, 9, 5, 33);
    expect(formatBackupStamp(d)).toBe("2026-07-15_09-05");
    expect(backupFileName(d)).toBe("hosts_backup_2026-07-15_09-05.txt");
    expect(backupFileName(d)).toMatch(/^hosts_backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.txt$/);
  });
});

describe("normalizeIpList", () => {
  it("принимает строки и объекты {ip}, отбрасывает мусор (S4)", () => {
    expect(normalizeIpList(["1.2.3.4", null, 5, { ip: "5.6.7.8" }, { ip: "bad" }])).toEqual([
      "1.2.3.4",
      "5.6.7.8",
    ]);
    expect(normalizeIpList({ ip: "1.2.3.4" })).toEqual([]);
    expect(normalizeIpList("8.8.8.8")).toEqual(["8.8.8.8"]);
  });
});

describe("lineConflictsWithSpotifyDomains", () => {
  it("находит Spotify-домены, игнорирует комментарии и localhost", () => {
    expect(lineConflictsWithSpotifyDomains("8.8.8.8 open.spotify.com")).toBe(true);
    expect(lineConflictsWithSpotifyDomains("1.1.1.1 api.spotify.com # note")).toBe(true);
    expect(lineConflictsWithSpotifyDomains("9.9.9.9 Open.Spotify.Com")).toBe(true);
    expect(lineConflictsWithSpotifyDomains("# 1.1.1.1 open.spotify.com")).toBe(false);
    expect(lineConflictsWithSpotifyDomains("127.0.0.1 localhost")).toBe(false);
    expect(lineConflictsWithSpotifyDomains("")).toBe(false);
  });
});

describe("prepareHostsContent", () => {
  it("при apply снимает старые Spotify-строки и managed-блок, пишет новый блок первым после остального", () => {
    const oldBlock = buildBlock(["1.1.1.1"]);
    const before = [
      "127.0.0.1 localhost",
      "8.8.8.8 open.spotify.com",
      "9.9.9.9 api.spotify.com",
      "10.0.0.1 my-game.local",
      oldBlock,
      "",
    ].join("\n");
    const newBlock = buildBlock(["95.182.120.241"]);
    const { content, strippedConflicts, removedManagedBlock } = prepareHostsContent(
      before,
      "apply",
      newBlock,
    );
    expect(removedManagedBlock).toBe(true);
    expect(strippedConflicts).toBe(2);
    expect(content).toContain("127.0.0.1 localhost");
    expect(content).toContain("10.0.0.1 my-game.local");
    expect(content).not.toContain("8.8.8.8 open.spotify.com");
    expect(content).not.toContain("9.9.9.9 api.spotify.com");
    expect(content).not.toContain("1.1.1.1 open.spotify.com");
    expect(content).toContain("95.182.120.241 open.spotify.com");
    // Единственная запись open.spotify.com — наша
    const openLines = content.split("\n").filter((l) => /open\.spotify\.com/i.test(l) && !l.trim().startsWith("#"));
    expect(openLines).toHaveLength(1);
    expect(openLines[0].startsWith("95.182.120.241")).toBe(true);
  });

  it("при remove убирает только managed-блок, чужие Spotify-строки оставляет", () => {
    const block = buildBlock(["1.1.1.1"]);
    const before = `127.0.0.1 localhost\n8.8.8.8 open.spotify.com\n${block}\n`;
    const { content, strippedConflicts, removedManagedBlock } = prepareHostsContent(before, "remove");
    expect(removedManagedBlock).toBe(true);
    expect(strippedConflicts).toBe(0);
    expect(content).toContain("8.8.8.8 open.spotify.com");
    expect(content).not.toContain(START_MARKER);
    expect(content).not.toContain("1.1.1.1 open.spotify.com");
  });
});

describe("validateIp", () => {
  it("принимает корректные IPv4, включая граничные значения октетов", () => {
    expect(validateIp("0.0.0.0")).toBe(true);
    expect(validateIp("127.0.0.1")).toBe(true);
    expect(validateIp("255.255.255.255")).toBe(true);
    expect(validateIp("1.2.3.4")).toBe(true);
    expect(validateIp("37.230.192.51")).toBe(true);
  });

  it("отвергает октеты вне диапазона 0–255 (регрессия на宽松-regex)", () => {
    // Прежний \d{1,3} пропускал такие значения в hosts.
    expect(validateIp("999.999.999.999")).toBe(false);
    expect(validateIp("256.0.0.1")).toBe(false);
    expect(validateIp("1.2.3.256")).toBe(false);
    expect(validateIp("1000.1.1.1")).toBe(false);
  });

  it("отвергает не-IP и нестроковые значения", () => {
    expect(validateIp("not-an-ip")).toBe(false);
    expect(validateIp("evil; rm -rf /")).toBe(false);
    expect(validateIp("")).toBe(false);
    expect(validateIp("1.2.3")).toBe(false);
    expect(validateIp("1.2.3.4.5")).toBe(false);
    expect(validateIp(undefined)).toBe(false);
    expect(validateIp(null)).toBe(false);
    expect(validateIp(123)).toBe(false);
    expect(validateIp(["1.2.3.4"])).toBe(false);
  });
});
