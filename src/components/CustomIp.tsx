import React, { useState } from "react";
import { Crosshair, Loader2, Plus, Search } from "lucide-react";
import { validateIp } from "../../shared/hostsBlock";
import type { IpRecord } from "../types";

interface CustomIpProps {
  onChecked: (record: IpRecord) => void;
  addLog: (msg: string, level?: "info" | "success" | "warn" | "error") => void;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export const CustomIp: React.FC<CustomIpProps> = ({ onChecked, addLog, showToast }) => {
  const [value, setValue] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  // null — ещё не проверяли; иначе результат последней проверки.
  const [lastResult, setLastResult] = useState<IpRecord | null>(null);

  const trimmed = value.trim();
  const formatOk = trimmed.length === 0 || validateIp(trimmed);

  const handleCheck = async () => {
    if (!validateIp(trimmed)) {
      showToast("Введите корректный IPv4-адрес (например 1.2.3.4).", "error");
      return;
    }

    setIsChecking(true);
    setLastResult(null);
    addLog(`[CUSTOM] Проверяю доступность ${trimmed} (TCP :443)...`, "info");

    try {
      const latency = await window.api.pingIp(trimmed);
      const record: IpRecord = {
        ip: trimmed,
        status: latency !== null ? "Up" : "Down",
        provider: "Свой IP",
        latency: latency ?? undefined,
      };
      setLastResult(record);

      if (record.status === "Up") {
        addLog(`[CUSTOM] ${trimmed} в сети, задержка ${latency} мс.`, "success");
        showToast(`${trimmed} доступен (${latency} мс)`, "success");
        onChecked(record);
      } else {
        addLog(`[CUSTOM] ${trimmed} не отвечает на TCP :443.`, "warn");
        showToast(`${trimmed} недоступен`, "warning");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка проверки IP.";
      addLog(`[CUSTOM ERROR] ${msg}`, "error");
      showToast("Не удалось проверить IP.", "error");
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isChecking) {
      e.preventDefault();
      void handleCheck();
    }
  };

  return (
    <div
      id="custom-ip-panel"
      className="bg-neutral-50 dark:bg-[#1c1b1f] border border-neutral-200/80 dark:border-white/10 rounded-[24px] p-5 transition-all duration-300 shadow-md"
    >
      <div className="flex items-center justify-between mb-4 border-b border-neutral-150 dark:border-white/5 pb-2.5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-[#938f99] flex items-center gap-2">
          <Crosshair size={14} className="text-[#1DB954]" />
          Свой IP-адрес
        </h3>
      </div>

      <p className="text-[11px] text-neutral-500 dark:text-[#938f99] leading-relaxed mb-3">
        Укажите IPv4-адрес вручную. Программа проверит доступность по TCP :443 и, если узел в сети,
        добавит его в список — его можно выбрать для записи в hosts.
      </p>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <input
            id="custom-ip-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="например 37.230.192.51"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setLastResult(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isChecking}
            className={`w-full h-10 px-3.5 rounded-xl text-xs font-mono bg-white dark:bg-white/[0.04] border transition-colors outline-none disabled:opacity-50 ${
              !formatOk
                ? "border-rose-400/70 focus:border-rose-500 text-rose-600 dark:text-rose-400"
                : "border-neutral-200 dark:border-white/10 focus:border-[#1DB954]/60 text-neutral-800 dark:text-[#e6e1e5]"
            }`}
          />
          {!formatOk && (
            <p className="text-[10px] text-rose-500 mt-1.5 font-medium">Некорректный формат IPv4</p>
          )}
        </div>
        <button
          id="btn-check-custom-ip"
          onClick={() => void handleCheck()}
          disabled={isChecking || !trimmed || !formatOk}
          className="h-10 px-4 flex-shrink-0 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-[#19B850] dark:text-[#1DB954] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer active:scale-[0.98]"
        >
          {isChecking ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          {isChecking ? "Проверяю..." : "Проверить"}
        </button>
      </div>

      {lastResult && (
        <div
          className={`mt-3 flex items-center justify-between gap-2 p-3 rounded-xl border ${
            lastResult.status === "Up"
              ? "bg-[#1DB954]/8 border-[#1DB954]/25"
              : "bg-rose-500/8 border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`inline-flex rounded-full h-2 w-2 flex-shrink-0 ${
                lastResult.status === "Up" ? "bg-[#1DB954]" : "bg-rose-500"
              }`}
            />
            <div className="truncate">
              <p className="text-xs font-mono font-medium text-neutral-800 dark:text-[#e6e1e5]">
                {lastResult.ip}
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-[#938f99]">
                {lastResult.status === "Up"
                  ? `В сети${lastResult.latency != null ? ` · ${lastResult.latency} мс` : ""}`
                  : "Не отвечает на :443"}
              </p>
            </div>
          </div>
          {lastResult.status === "Up" && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#1DB954] flex items-center gap-1 flex-shrink-0">
              <Plus size={11} />
              В списке
            </span>
          )}
        </div>
      )}
    </div>
  );
};
