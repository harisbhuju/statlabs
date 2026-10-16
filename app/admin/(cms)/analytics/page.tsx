import Link from "next/link";
import { Breakdown } from "@/components/admin/analytics/Breakdown";
import { deviceLabel, fmtDuration, fmtNum, fmtPct } from "@/components/admin/analytics/format";
import { LivePanel } from "@/components/admin/analytics/LivePanel";
import { Place } from "@/components/admin/analytics/Place";
import { TrafficChart } from "@/components/admin/analytics/TrafficChart";
import { getAnalytics, getLive, RANGES, type Kpis, type RangeKey } from "@/lib/analytics/queries";

export const dynamic = "force-dynamic";

const KPI_META: Array<{
  key: keyof Kpis;
  label: string;
  help: string;
  format: (n: number) => string;
  lowerIsBetter?: boolean;
}> = [
  { key: "visitors", label: "Visitors", help: "Different people, counted once per day", format: fmtNum },
  { key: "visits", label: "Visits", help: "Sessions; a new visit starts after 30 min away", format: fmtNum },
  { key: "pageviews", label: "Page views", help: "Pages opened; reloads are not counted", format: fmtNum },
  { key: "pagesPerVisit", label: "Pages per visit", help: "How far people read", format: (n) => n.toFixed(1) },
  { key: "bounceRate", label: "Bounce rate", help: "Visits that saw only one page", format: fmtPct, lowerIsBetter: true },
  { key: "avgDurationSec", label: "Visit length", help: "Average time from first to last activity", format: fmtDuration },
];

const PREVIOUS_LABEL: Record<RangeKey, string> = {
  today: "same time yesterday",
  "7d": "previous 7 days",
  "30d": "previous 30 days",
  "90d": "previous 90 days",
};

function Change({ now, before, lowerIsBetter }: { now: number; before: number; lowerIsBetter?: boolean }) {
  if (before === 0) {
    return <span className="text-[12px] text-muted">{now > 0 ? "New this period" : "No data yet"}</span>;
  }
  const pct = Math.round(((now - before) / before) * 100);
  if (Math.abs(pct) < 1) return <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[12px] font-semibold text-ink-2">No change</span>;
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${good ? "bg-up-bg text-up-fg" : "bg-accent-soft text-accent"}`}>
      {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const raw = (await searchParams).range;
  const range: RangeKey = typeof raw === "string" && raw in RANGES ? (raw as RangeKey) : "7d";
  const [a, live] = await Promise.all([getAnalytics(range), getLive()]);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Analytics</h1>
          <p className="mt-1 text-[13px] text-muted">
            Cookieless and anonymous. Reloads don&apos;t count. Times in {a.timezone}.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Date range">
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <Link key={k} href={`/admin/analytics?range=${k}`} className="pill" aria-pressed={k === range}>
              {RANGES[k].label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Summary">
        {KPI_META.map((m) => (
          <div key={m.key} className="card flex flex-col gap-1.5 p-4">
            <div className="text-[12.5px] text-ink-2">{m.label}</div>
            <div className="num text-[28px] font-extrabold leading-none tracking-[-0.03em]">{m.format(a.current[m.key])}</div>
            <Change now={a.current[m.key]} before={a.previous[m.key]} lowerIsBetter={m.lowerIsBetter} />
            <div className="mt-auto pt-1 text-[11px] leading-snug text-muted">{m.help}</div>
          </div>
        ))}
      </section>
      <p className="-mt-2 font-mono text-[11px] text-muted">Changes compare with the {PREVIOUS_LABEL[range]}.</p>

      <section className="card p-5">
        <h2 className="mb-3 text-[15px] font-bold tracking-tight">
          Traffic {range === "today" ? "by hour" : "by day"}
        </h2>
        {a.current.pageviews === 0 ? (
          <p className="py-10 text-center text-[13px] text-muted">No visits in this period yet.</p>
        ) : (
          <TrafficChart data={a.series} unit={a.unit} />
        )}
      </section>

      <LivePanel initial={live} />

      <h2 className="mt-3 text-xl font-extrabold tracking-tight">Where visitors are from</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Countries"
          valueLabel="Visitors"
          items={a.countries.map((c) => ({
            key: c.key || "unknown",
            label: <Place country={c.key} />,
            value: c.visitors,
            secondary: `${fmtNum(c.views)} views`,
          }))}
        />
        <Breakdown
          title="Cities"
          valueLabel="Visitors"
          empty="City data starts with visits after this update."
          items={a.cities.map((c) => ({
            key: `${c.key}-${c.country}`,
            label: <Place country={c.country} city={c.key} />,
            value: c.visitors,
            secondary: `${fmtNum(c.views)} views`,
          }))}
        />
      </div>

      <h2 className="mt-3 text-xl font-extrabold tracking-tight">How they found the site</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown
          title="Channels"
          valueLabel="Visits"
          items={a.channels.map((c) => ({ key: c.key, label: c.key, value: c.visits }))}
        />
        <Breakdown
          title="Referring websites"
          valueLabel="Visits"
          empty="No visits from other websites yet."
          items={a.referrers.map((r) => ({ key: r.key, label: r.key, value: r.visits }))}
        />
        <Breakdown
          title="Campaigns (utm_campaign)"
          valueLabel="Visits"
          empty="Add ?utm_campaign=name to links you share to see them here."
          items={a.campaigns.map((c) => ({ key: c.key, label: c.key, value: c.visits }))}
        />
      </div>

      <h2 className="mt-3 text-xl font-extrabold tracking-tight">What they read</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Top pages"
          valueLabel="Views"
          items={a.pages.map((p) => ({
            key: p.key,
            label: <span className="font-mono text-[12.5px]">{p.key}</span>,
            value: p.views,
            secondary: `${fmtNum(p.visitors)} visitors`,
          }))}
        />
        <Breakdown
          title="Landing pages"
          valueLabel="Visits"
          items={a.entryPages.map((p) => ({
            key: p.key,
            label: <span className="font-mono text-[12.5px]">{p.key}</span>,
            value: p.visits,
          }))}
        />
      </div>

      <h2 className="mt-3 text-xl font-extrabold tracking-tight">Devices</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {(
          [
            ["Device type", a.devices, deviceLabel],
            ["Browsers", a.browsers, (k: string) => k || "Unknown"],
            ["Operating systems", a.oses, (k: string) => k || "Unknown"],
          ] as const
        ).map(([title, list, name]) => (
          <Breakdown
            key={title}
            title={title}
            valueLabel="Visitors"
            items={list.map((d) => ({ key: d.key || "unknown", label: name(d.key), value: d.visitors }))}
          />
        ))}
      </div>
    </div>
  );
}
