import React from "react";
import { AlertCircle, RefreshCw, Server, Zap, WifiOff, Check, X } from "lucide-react";
import { IpRecord } from "../types";

interface IPListProps {
  ips: IpRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  /** IP, выбранный для записи в hosts (null — автовыбор лучшего). */
  selectedIp: string | null;
  onSelectIp: (ip: string) => void;
  /** Удалить «Свой IP» из списка вручную. */
  onRemoveIp?: (ip: string) => void;
}

export const IPList: React.FC<IPListProps> = ({
  ips,
  isLoading,
  onRefresh,
  selectedIp,
  onSelectIp,
  onRemoveIp,
}) => {
  const upCount = ips.filter((ip) => ip.status === "Up").length;
  // Все узлы найдены, но ни один не отвечает — скорее всего, нет связи
  // (в отличие от «пустой список», который практически недостижим из-за резервных IP).
  const allDown = ips.length > 0 && upCount === 0;

  const isRemovable = (provider: string) => provider === "Свой IP";

  return (
    <div
      id="ip-list-panel"
      className="bg-neutral-50 dark:bg-[#1c1b1f] border border-neutral-200/80 dark:border-white/10 rounded-[24px] p-5 transition-all duration-300 shadow-md min-w-0 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-neutral-200/80 dark:border-white/5 pb-2.5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-[#938f99] flex items-center gap-2 min-w-0">
          <Server size={14} className="text-[#1DB954] flex-shrink-0" />
          <span className="truncate">Активные прокси-узлы</span>
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs flex items-center gap-1.5 font-bold bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-[#19B850] dark:text-[#1DB954] px-3 py-1 rounded-full transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
          id="btn-refresh-ips"
        >
          <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2.5">
          <RefreshCw size={22} className="animate-spin text-[#1DB954]" />
          <span className="text-[11px] text-neutral-400 dark:text-[#938f99] font-mono">
            Загрузка статусов в реальном времени...
          </span>
        </div>
      ) : ips.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle size={20} className="mx-auto text-yellow-500 mb-1.5" />
          <p className="text-xs text-neutral-500 dark:text-[#938f99]">
            Доступных прокси-узлов GeoHide не найдено.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto overflow-x-hidden pr-1 overscroll-contain">
          {allDown && (
            <div className="flex items-start gap-2 p-3 mb-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <WifiOff size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Все узлы недоступны
                </p>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
                  Проверьте подключение к интернету, введите свой IP ниже или нажмите «Обновить».
                </p>
              </div>
            </div>
          )}
          {upCount > 0 && (
            <p className="text-[10px] text-neutral-400 dark:text-[#938f99] px-0.5 pb-0.5">
              Нажмите на узел «В сети», чтобы выбрать его для hosts. Без выбора — лучший по задержке.
            </p>
          )}
          {ips.map((item, index) => {
            const isSelected = selectedIp === item.ip;
            const canSelect = item.status === "Up";
            const removable = isRemovable(item.provider);
            return (
              <div
                key={`${item.ip}-${index}`}
                className={`w-full flex items-center gap-1 p-1 rounded-xl transition-all duration-200 border ${
                  isSelected
                    ? "bg-[#1DB954]/12 border-[#1DB954]/40 dark:bg-[#1DB954]/15"
                    : "bg-neutral-100/50 dark:bg-white/[0.03] border-transparent hover:border-neutral-300 dark:hover:border-white/10 dark:hover:bg-white/[0.05]"
                }`}
              >
                <button
                  type="button"
                  disabled={!canSelect}
                  onClick={() => canSelect && onSelectIp(item.ip)}
                  className={`flex-1 min-w-0 text-left flex items-center justify-between p-2.5 rounded-lg ${
                    canSelect ? "cursor-pointer" : "cursor-default opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.status === "Up" ? (
                      <div className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1DB954] shadow-[0_0_8px_#1DB954]" />
                      </div>
                    ) : (
                      <span className="inline-flex rounded-full h-2 w-2 bg-rose-500 flex-shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="text-xs font-mono font-medium text-neutral-800 dark:text-[#e6e1e5] tracking-tight">
                        {item.ip}
                      </p>
                      <p className="text-[9px] text-neutral-400 dark:text-[#938f99] uppercase font-bold tracking-wider mt-0.5 truncate">
                        {item.provider}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {item.latency != null && (
                      <span className="text-[9px] font-mono text-neutral-500 dark:text-[#938f99] flex items-center gap-1 bg-neutral-200/40 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        <Zap size={9} className="text-amber-500" />
                        {item.latency} мс
                      </span>
                    )}
                    {isSelected ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#1DB954]/20 text-[#1DB954] flex items-center gap-1">
                        <Check size={10} />
                        Выбран
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === "Up"
                            ? "bg-[#1DB954]/15 text-[#1DB954] dark:bg-[#1DB954]/20"
                            : "bg-rose-500/15 text-rose-500 dark:bg-rose-500/20"
                        }`}
                      >
                        {item.status === "Up" ? "В сети" : "Не в сети"}
                      </span>
                    )}
                  </div>
                </button>
                {removable && onRemoveIp && (
                  <button
                    type="button"
                    title="Удалить из списка"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveIp(item.ip);
                    }}
                    className="flex-shrink-0 p-2 mr-1 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
