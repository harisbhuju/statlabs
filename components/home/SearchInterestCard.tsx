"use client";

import { useState } from "react";
import type { TrendsSummary } from "@/lib/sources/trendsSummary";

const W = 560;
const H = 210;
const PAD = { l: 4, r: 4, t: 30, b: 24 };
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const VERDICT_STYLE = {
  up: "bg-up-bg text-up-fg",
  down: "bg-accent-soft text-accent",
  same: "bg-surface-2 text-ink-2",
  unknown: "bg-surface-2 text-muted",
} as const;
const VERDICT_ICON = { up: "▲ ", down: "▼ ", same: "", unknown: "" } as const;

/** Describes a point relative to the busiest point in the period. */
function describe(value: number, peak: number, unit: string) {
  const pct = peak > 0 ? Math.round((value / peak) * 100) : 0;
  if (pct >= 100) return `The busiest ${unit} in 3 months`;
  if (pct >= 60) return `Very busy: ${pct}% of the busiest ${unit}`;
  if (pct >= 30) return `Picking up: ${pct}% of the busiest ${unit}`;
  return `Quiet: ${pct}% of the busiest ${unit}`;
}

export function SearchInterestCard({ summary }: { summary: TrendsSummary }) {
  const { series, peakIndex, unit } = summary;
  const [hover, setHover] = useState<number | null>(null);

  const n = series.length;
  const peak = series[peakIndex].value;
  // Scale to the busiest point (not a fixed 0–100) so the shape is readable at any volume.
  const top = Math.max(peak, 1);
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  const pts = series.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");

  // Month labels at the first point of each month, skipping any that would collide.
  const months: Array<{ i: number; label: string }> = [];
  series.forEach((p, i) => {
    const m = new Date(p.date).getUTCMonth();
    const prev = i > 0 ? new Date(series[i - 1].date).getUTCMonth() : -1;
    if (m !== prev && (months.length === 0 || x(i) - x(months.at(-1)!.i) > 60)) {
      months.push({ i, label: monthFmt.format(new Date(p.date)) });
    }
  });

  const peakLabelLeft = x(peakIndex) > W * 0.6;
  const unitWord = unit === "week" ? "week" : "day";

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((sx - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1)))));
  }

  const hoverPoint = hover != null ? series[hover] : null;

  return (
    <article id="search-interest" className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby="search-interest-title">
      <h2 id="search-interest-title" className="text-[18px] font-bold tracking-tight">
        How often people Google “{summary.mainTerm}”
      </h2>
      <p className="mt-3 text-[16px] leading-relaxed text-ink-2 [text-wrap:pretty]">
        {summary.takeaway.before}
        <mark className="rounded bg-accent-soft px-1 font-bold text-accent">{summary.takeaway.highlight}</mark>
        {summary.takeaway.after}
      </p>

      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={`Google searches for ${summary.mainTerm} over the last 3 months. ${summary.takeaway.before}${summary.takeaway.highlight}${summary.takeaway.after}`}
        >
          <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="var(--border-strong)" />
          <polygon
            points={`${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`}
            fill="var(--accent)"
            fillOpacity={0.08}
          />
          <polyline
            points={pts}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx={x(peakIndex)} cy={y(series[peakIndex].value)} r={4.5} fill="var(--accent)" stroke="#fff" strokeWidth={2} />
          <text
            x={x(peakIndex) + (peakLabelLeft ? -10 : 10)}
            y={y(series[peakIndex].value) + 4}
            textAnchor={peakLabelLeft ? "end" : "start"}
            className="fill-accent text-[12px] font-semibold"
          >
            Busiest {unitWord}
          </text>
          {months.map((m, k) => (
            <text
              key={m.i}
              x={x(m.i)}
              y={H - 6}
              textAnchor={k === 0 ? "start" : x(m.i) > W - 40 ? "end" : "middle"}
              className="fill-muted font-mono text-[10px]"
            >
              {m.label}
            </text>
          ))}
          {hoverPoint && (
            <>
              <line x1={x(hover!)} x2={x(hover!)} y1={PAD.t} y2={y(0)} stroke="var(--border-strong)" />
              <circle cx={x(hover!)} cy={y(hoverPoint.value)} r={4} fill="var(--accent)" stroke="#fff" strokeWidth={2} />
            </>
          )}
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
        {hoverPoint && (
          <div
            className="pointer-events-none absolute top-0 min-w-44 rounded-lg bg-foreground px-3 py-2 text-[12px] text-white shadow-lg"
            style={
              x(hover!) > W / 2
                ? { right: `${100 - (x(hover!) / W) * 100 + 2}%` }
                : { left: `${(x(hover!) / W) * 100 + 2}%` }
            }
          >
            <div className="mb-0.5 font-mono text-[11px] text-white/60">
              {unit === "week" ? "Week of " : ""}
              {dayFmt.format(new Date(hoverPoint.date))}
            </div>
            {describe(hoverPoint.value, peak, unitWord)}
          </div>
        )}
      </div>

      <ul className="mt-4">
        {summary.compare.map((c) => (
          <li key={c.term} className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-[14px]">
            <span className="min-w-0">{c.term}</span>
            <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${VERDICT_STYLE[c.verdict.kind]}`}>
              {VERDICT_ICON[c.verdict.kind]}
              {c.verdict.label}
            </span>
          </li>
        ))}
      </ul>

      {summary.rising[0] && (
        <p className="mt-1 border-t border-border pt-3 text-[13px] text-ink-2">
          People are also searching for <b className="font-semibold text-foreground">“{summary.rising[0].query}”</b>
        </p>
      )}
      <p className="mt-3 font-mono text-[10.5px] text-muted">
        Last 7 days compared with the same span a month earlier · Source: Google Trends
      </p>
    </article>
  );
}

export function SearchInterestPending() {
  return (
    <article id="search-interest" className="card scroll-mt-24 p-5 sm:p-6">
      <h2 className="text-[18px] font-bold tracking-tight">How often people Google “superintelligence”</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        This chart will show how often people search for superintelligence, AGI and artificial superintelligence
        on Google, with a plain-English summary of what changed this month.
      </p>
      <div className="mt-5 grid h-48 place-items-center rounded-lg border border-dashed border-border-strong">
        <p className="max-w-xs text-center text-[13.5px] text-muted">
          Google search data isn&apos;t connected yet. It appears here automatically once it is.
        </p>
      </div>
    </article>
  );
}
