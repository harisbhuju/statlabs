"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendsPayload } from "@/lib/sources/types";

// Validated categorical slots (light + dark) — see globals.css --series-*.
const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fmtDate = (d: string) => dateFmt.format(new Date(d));

type TooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
};

function ChartTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="min-w-44 border border-rule bg-surface px-3 py-2.5 text-xs shadow-none">
      <div className="eyebrow mb-1.5">{fmtDate(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 py-0.5">
          <span className="flex items-center gap-2 text-ink-2">
            <span className="h-[2px] w-3" style={{ background: p.color }} />
            {p.dataKey}
          </span>
          <span className="num font-mono text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendsChart({ data }: { data: TrendsPayload }) {
  const last = data.points.at(-1);
  return (
    <div className="flex h-full flex-col">
      {/* Legend doubles as a direct label: series name + latest value. */}
      <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
        {data.terms.map((term, i) => (
          <li key={term} className="flex items-baseline gap-2">
            <span className="h-[2px] w-4 translate-y-[-3px]" style={{ background: SERIES[i % SERIES.length] }} />
            <span className="text-[13px] text-ink-2">{term}</span>
            <span className="num font-mono text-[13px] text-foreground">{last ? String(last[term] ?? "–") : "–"}</span>
          </li>
        ))}
      </ul>
      <div className="h-60 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.points} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 10.5, fontFamily: "var(--font-geist-mono)" }}
              tickFormatter={fmtDate}
              tickLine={false}
              axisLine={{ stroke: "var(--rule)" }}
              minTickGap={48}
              dy={6}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 10.5, fontFamily: "var(--font-geist-mono)" }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--foreground)", strokeWidth: 1 }} />
            {data.terms.map((term, i) => (
              <Line
                key={term}
                type="monotone"
                dataKey={term}
                stroke={SERIES[i % SERIES.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
