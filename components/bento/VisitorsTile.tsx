"use client";

import { useEffect, useState } from "react";
import type { VisitorStats } from "@/lib/visitors";
import { LiveLabel, Tile } from "./Tile";

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

  const show = (n?: number) => (stats ? fmt.format(n ?? 0) : "–");

  return (
    <Tile index="02" title="Readership" meta={<LiveLabel />} className={className}>
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <div className="num font-display text-[72px] leading-[0.85] sm:text-[88px] tracking-tight">{show(stats?.online)}</div>
          <div className="mt-3 text-sm text-ink-2">reading StatLabs right now</div>
        </div>
        <dl className="grid grid-cols-3 border-t border-border">
          {[
            ["Today", stats?.today],
            ["All time", stats?.total],
            ["Page views", stats?.pageviews],
          ].map(([label, n], i) => (
            <div key={label as string} className={`pt-3 ${i > 0 ? "border-l border-border pl-3" : ""}`}>
              <dt className="eyebrow">{label}</dt>
              <dd className="num mt-1 font-mono text-xl">{show(n as number | undefined)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Tile>
  );
}
