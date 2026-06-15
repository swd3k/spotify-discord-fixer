import React, { useState, useEffect } from "react";
import { Copy, Check, Code, FileCheck } from "lucide-react";
import { IpRecord } from "../types";

interface Props {
  activeIps: IpRecord[];
  hostsActive: boolean;
  addLog: (msg: string) => void;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export const HostsBlockPreview: React.FC<Props> = ({ activeIps, hostsActive, addLog, showToast }) => {
  const [copied, setCopied] = useState(false);
  const [blockText, setBlockText] = useState("");
  const [installedText, setInstalledText] = useState("");

  // Узлы уже отсортированы по задержке; блок строится для одного лучшего.
  const ips = activeIps.filter((ip) => ip.status === "Up").map((ip) => ip.ip);

  useEffect(() => {
    let cancelled = false;
    window.api.getBlockText(ips).then((text) => {
      if (!cancelled) setBlockText(text);
    });
    return () => {
      cancelled = true;
    };
  }, [ips.join(",")]);

  // Реальный установленный блок из файла hosts (если перенаправления активны).
  useEffect(() => {
    let cancelled = false;
    if (!hostsActive) {
      setInstalledText("");
      return;
    }
    window.api.getActiveBlock().then((block) => {
      if (!cancelled) setInstalledText(block?.text || "");
    });
    return () => {
      cancelled = true;
    };
  }, [hostsActive]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(blockText);
    setCopied(true);
    showToast("Блок hosts скопирован в буфер обмена!", "success");
    addLog("[UTILITY] Скопирован предпросмотр блока hosts.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-50 dark:bg-[#1c1b1f] border border-neutral-200/80 dark:border-white/10 rounded-[24px] p-5 transition-all duration-300 shadow-md">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-[#938f99] flex items-center gap-2 mb-4 border-b border-neutral-150 dark:border-white/5 pb-2.5">
        <Code size={14} className="text-[#1DB954]" />
        Предпросмотр записей hosts
      </h3>

      <div className="text-xs text-neutral-500 dark:text-[#938f99] leading-relaxed mb-3">
        Эти строки будут добавлены в системный файл hosts при нажатии «Обновить и применить» (один лучший узел на все домены). Программа сделает резервную копию и потребует прав администратора.
      </div>

      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2.5 right-2.5 bg-neutral-250 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-[#e6e1e5] rounded-lg p-2 transition-all cursor-pointer shadow-xs"
          title="Скопировать блок"
        >
          {copied ? <Check size={13} className="text-emerald-500 animate-pulse" /> : <Copy size={13} />}
        </button>
        <pre className="text-[9px] font-mono bg-[#0c0c0c] text-[#e6e1e5]/80 p-4 rounded-2xl border border-neutral-850 dark:border-white/5 overflow-y-auto max-h-44 leading-relaxed whitespace-pre select-all">
          {blockText || "# Нет активных IP для предпросмотра."}
        </pre>
      </div>

      {installedText && (
        <>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-[#938f99] flex items-center gap-2 my-4 border-b border-neutral-150 dark:border-white/5 pb-2.5">
            <FileCheck size={14} className="text-[#1DB954]" />
            Сейчас установлено в hosts
          </h3>
          <pre className="text-[9px] font-mono bg-[#0c0c0c] text-[#e6e1e5]/80 p-4 rounded-2xl border border-neutral-850 dark:border-white/5 overflow-y-auto max-h-44 leading-relaxed whitespace-pre select-all">
            {installedText}
          </pre>
        </>
      )}
    </div>
  );
};
