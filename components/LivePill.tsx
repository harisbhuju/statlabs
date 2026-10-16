"use client";

import { useVisitorStats } from "./useVisitorStats";

const fmt = new Intl.NumberFormat("en");

export function LivePill() {
  const stats = useVisitorStats();
  return (
    <span className="flex items-center gap-2 whitespace-nowrap text-[12.5px] text-ink-2" aria-live="polite">
      <span className="live-dot" aria-hidden />
      <span>
        <b className="num text-foreground">{stats ? fmt.format(stats.online) : "–"}</b> online
        <span className="hidden sm:inline">
          {" · "}
          <span className="num">{stats ? fmt.format(stats.pageviews) : "–"}</span> views since launch
        </span>
      </span>
    </span>
  );
}
