"use client";

import { useState } from "react";

type Point = { bucket: string; visitors: number; views: number };

// Wide drawing area so axis text stays small when the chart fills a desktop-width card.
const W = 1100;
const H = 260;
const PAD = { l: 34, r: 8, t: 12, b: 26 };
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function label(bucket: string, unit: "hour" | "day", full = false) {
  const d = new Date(`${bucket}:00Z`);
  if (unit === "hour") return `${bucket.slice(11, 13)}:00`;
  return (full ? fullDayFmt : dayFmt).format(d);
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
}

/** Page views as bars, visitors as a line, on one shared count axis. */
export function TrafficChart({ data, unit }: { data: Point[]; unit: "hour" | "day" }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = data.length;
  if (n === 0) return null;

  const max = niceMax(Math.max(...data.map((d) => Math.max(d.views, d.visitors))));
  const bw = (W - PAD.l - PAD.r) / n;
  const cx = (i: number) => PAD.l + bw * (i + 0.5);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const ticks = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  const line = data.map((d, i) => `${cx(i)},${y(d.visitors)}`).join(" ");

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.floor((sx - PAD.l) / bw))));
  }

  const h = hover != null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-[12.5px] text-ink-2">
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-sm bg-[#d4d1ca]" aria-hidden />
          Page views
        </span>
        <span className="flex items-center gap-2">
          <i className="h-[2px] w-3.5 rounded bg-accent" aria-hidden />
          Visitors
        </span>
      </div>
      {/* On phones the chart keeps a readable size and scrolls sideways. */}
      <div className="-mx-1 overflow-x-auto px-1">
      <div className="relative min-w-[640px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Visitors and page views over time">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--border-strong)" : "var(--border)"} />
              <text x={PAD.l - 8} y={y(t) + 3} textAnchor="end" className="fill-muted font-mono text-[10px]">
                {Math.round(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <rect
              key={d.bucket}
              x={cx(i) - Math.min(bw * 0.32, 14)}
              width={Math.min(bw * 0.64, 28)}
              y={y(d.views)}
              height={Math.max(0, y(0) - y(d.views))}
              rx={2}
              fill={hover === i ? "#bdb9b0" : "#d4d1ca"}
            />
          ))}
          <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text key={d.bucket} x={cx(i)} y={H - 6} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                {label(d.bucket, unit)}
              </text>
            ) : null,
          )}
          {h && <circle cx={cx(hover!)} cy={y(h.visitors)} r={4} fill="var(--accent)" stroke="#fff" strokeWidth={2} />}
          <rect
            x={PAD.l}
            y={0}
            width={W - PAD.l - PAD.r}
            height={H}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
            style={{ touchAction: "pan-y" }}
          />
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute top-0 min-w-40 rounded-lg bg-foreground px-3 py-2 text-[12px] text-white shadow-lg"
            style={
              cx(hover!) > W / 2
                ? { right: `${100 - (cx(hover!) / W) * 100 + 2}%` }
                : { left: `${(cx(hover!) / W) * 100 + 2}%` }
            }
          >
            <div className="mb-1 font-mono text-[11px] text-white/60">{label(h.bucket, unit, true)}</div>
            <div className="flex justify-between gap-4">
              <span>Visitors</span>
              <b className="num font-mono">{h.visitors}</b>
            </div>
            <div className="flex justify-between gap-4">
              <span>Page views</span>
              <b className="num font-mono">{h.views}</b>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
