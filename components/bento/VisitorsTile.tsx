"use client";

import { useEffect, useState } from "react";
import type { VisitorStats } from "@/lib/visitors";
import { LiveBadge, Tile } from "./Tile";

const POLL_MS = 30_000;
const fmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function VisitorsTile({ className }: { className?: string }) {
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/stats/visitors", { cache: "no-store" })
        .then((r) => r.json())
        .then((s: VisitorStats) => alive && setStats(s))
        .catch(() => {});
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const show = (n?: number) => (stats ? fmt.format(n ?? 0) : "—");

  return (
    <Tile title="Visitors" badge={<LiveBadge />} className={className}>
      <div className="flex h-full flex-col justify-between gap-4">
        <div>
          <div className="font-mono text-5xl font-semibold tabular-nums text-live">{show(stats?.online)}</div>
          <div className="mt-1 text-xs text-muted">online right now</div>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Today", stats?.today],
            ["All-time", stats?.total],
            ["Views", stats?.pageviews],
          ].map(([label, n]) => (
            <div key={label as string} className="rounded-lg bg-surface-2 px-2 py-2">
              <dd className="font-mono text-lg tabular-nums">{show(n as number | undefined)}</dd>
              <dt className="text-[11px] text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </Tile>
  );
}
