"use client";

import { useEffect, useState } from "react";
import { TimeAgo } from "@/components/TimeAgo";
import type { LiveVisitor, RecentView } from "@/lib/analytics/queries";
import { deviceLabel } from "./format";
import { Place } from "./Place";

type Live = { online: LiveVisitor[]; recent: RecentView[] };
const POLL_MS = 15_000;

/** Who is on the site right now and the latest page views, refreshed every 15 seconds. */
export function LivePanel({ initial }: { initial: Live }) {
  const [live, setLive] = useState(initial);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/admin/analytics/live", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Live | null) => alive && d && setLive(d))
        .catch(() => {});
    const id = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <div className="card p-5">
        <h2 className="flex items-center justify-between text-[15px] font-bold tracking-tight">
          Right now
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-normal text-live">
            <span className="live-dot" aria-hidden />
            Live
          </span>
        </h2>
        <div className="num mt-3 text-[44px] font-extrabold leading-none tracking-[-0.04em]">{live.online.length}</div>
        <div className="mt-1 text-[13px] text-muted">{live.online.length === 1 ? "person on the site" : "people on the site"}</div>
        {live.online.length > 0 && (
          <ul className="mt-4 grid gap-1.5 border-t border-border pt-3 text-[13px]">
            {live.online.slice(0, 8).map((o, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-[12px]">{o.path}</span>
                <span className="shrink-0 text-muted">
                  <Place country={o.country} city={o.city} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card min-w-0 p-5">
        <h2 className="text-[15px] font-bold tracking-tight">Latest page views</h2>
        {live.recent.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">No page views yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead className="text-left font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="pb-2 font-normal">When</th>
                  <th className="pb-2 font-normal">Page</th>
                  <th className="pb-2 font-normal">From</th>
                  <th className="pb-2 font-normal">Source</th>
                  <th className="pb-2 font-normal">Device</th>
                </tr>
              </thead>
              <tbody>
                {live.recent.map((r, i) => (
                  <tr key={`${r.at}-${i}`} className="border-t border-border">
                    <td className="whitespace-nowrap py-2 pr-3 text-muted">
                      <TimeAgo iso={r.at} />
                    </td>
                    <td className="max-w-[220px] truncate py-2 pr-3 font-mono text-[12px]">{r.path}</td>
                    <td className="whitespace-nowrap py-2 pr-3">
                      <Place country={r.country} city={r.city} />
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3">
                      {r.channel}
                      {r.referrer && <span className="text-muted"> · {r.referrer}</span>}
                    </td>
                    <td className="whitespace-nowrap py-2 text-muted">
                      {deviceLabel(r.device)}
                      {r.browser ? ` · ${r.browser}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
