"use client";

import { useSyncExternalStore } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const noopSubscribe = () => () => {};

/** Today's date, read on the client so cached pages never show a stale date (empty on the server). */
export function Today({ className }: { className?: string }) {
  const label = useSyncExternalStore(noopSubscribe, () => fmt.format(new Date()), () => "");
  return <span className={className}>{label || " "}</span>;
}
