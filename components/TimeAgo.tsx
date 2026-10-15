"use client";

import { useEffect, useState } from "react";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function relative(iso: string) {
  const diff = (Date.parse(iso) - Date.now()) / 1000;
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "just now";
}

/** Relative time computed on the client so ISR-cached pages never show stale "x ago" text. */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setLabel(relative(iso));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [iso]);
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label ?? new Date(iso).toISOString().slice(0, 10)}
    </time>
  );
}
