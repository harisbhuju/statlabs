"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendsPayload } from "@/lib/sources/types";

const COLORS = ["var(--accent)", "var(--accent-2)", "var(--accent-3)"];

export function TrendsChart({ data }: { data: TrendsPayload }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {data.terms.map((term, i) => (
          <li key={term} className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {term}
          </li>
        ))}
      </ul>
      <div className="h-56 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.points} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <defs>
              {data.terms.map((term, i) => (
                <linearGradient key={term} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(d: string) => d.slice(5)}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            {data.terms.map((term, i) => (
              <Area
                key={term}
                type="monotone"
                dataKey={term}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                fill={`url(#g${i})`}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
