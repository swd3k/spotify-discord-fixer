import { describe, it, expect } from "vitest";
import {
  START_MARKER,
  END_MARKER,
  SPOTIFY_DOMAINS,
  buildBlock,
  extractBlock,
  pickBestIp,
  validateIp,
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
