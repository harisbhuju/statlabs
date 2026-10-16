import type { ReactNode } from "react";
import { fmtNum } from "./format";

export type BreakdownItem = { key: string; label: ReactNode; value: number; secondary?: string };

/** A ranked list where each row's background bar shows its share of the top value. */
export function Breakdown({
  title,
  valueLabel,
  items,
  empty = "No data for this period yet.",
}: {
  title: string;
  valueLabel: string;
  items: BreakdownItem[];
  empty?: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const top = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="card p-5">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">{valueLabel}</span>
      </header>
      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">{empty}</p>
      ) : (
        <ul className="grid gap-1">
          {items.map((i) => (
            <li key={i.key} className="relative overflow-hidden rounded-md">
              <span
                className="absolute inset-y-0 left-0 rounded-md bg-accent-soft"
                style={{ width: `${(i.value / top) * 100}%` }}
                aria-hidden
              />
              <span className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-[13.5px]">
                <span className="min-w-0 truncate">{i.label}</span>
                <span className="flex shrink-0 items-baseline gap-2">
                  {i.secondary && <span className="font-mono text-[11px] text-muted">{i.secondary}</span>}
                  <b className="num font-mono text-[12.5px] font-medium">{fmtNum(i.value)}</b>
                  <span className="num w-9 text-right font-mono text-[11px] text-muted">
                    {total ? `${Math.round((i.value / total) * 100)}%` : ""}
                  </span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
