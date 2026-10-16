import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { channelFor, type Channel } from "./channels";
import { ANALYTICS_TIMEZONE, VISIT_GAP_MS } from "./config";

export const RANGES = {
  today: { label: "Today", days: 1 },
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
} as const;
export type RangeKey = keyof typeof RANGES;

export type Kpis = {
  visitors: number;
  visits: number;
  pageviews: number;
  pagesPerVisit: number;
  bounceRate: number;
  avgDurationSec: number;
};
export type Row = { key: string; visitors: number; views: number };
export type Analytics = {
  range: RangeKey;
  timezone: string;
  unit: "hour" | "day";
  current: Kpis;
  previous: Kpis;
  series: Array<{ bucket: string; visitors: number; views: number }>;
  countries: Row[];
  cities: Array<Row & { country: string }>;
  channels: Array<{ key: Channel; visits: number }>;
  referrers: Array<{ key: string; visits: number }>;
  campaigns: Array<{ key: string; visits: number }>;
  pages: Row[];
  entryPages: Array<{ key: string; visits: number }>;
  devices: Row[];
  browsers: Row[];
  oses: Row[];
};

type Bounds = { start: Date; end: Date };
const gap = `${VISIT_GAP_MS / 60_000} minutes`;

async function rows<T>(query: SQL): Promise<T[]> {
  const res = (await db().execute(query)) as unknown as { rows: T[] };
  return res.rows;
}

/** Page views in the window, split into visits (no gap over 30 minutes between activity). */
function withVisits(b: Bounds) {
  return sql`
    with pv as (
      select *, greatest(coalesce(engaged_until, created_at), created_at) as active_until
      from pageviews
      where created_at >= ${b.start.toISOString()}::timestamptz and created_at < ${b.end.toISOString()}::timestamptz
    ),
    marked as (
      select *, case
        when created_at - lag(active_until) over (partition by visitor_hash order by created_at) <= ${gap}::interval
        then 0 else 1 end as is_entry
      from pv
    ),
    numbered as (
      select *, sum(is_entry) over (partition by visitor_hash order by created_at rows unbounded preceding) as visit_no
      from marked
    ),
    visits as (
      select visitor_hash, visit_no,
        count(*)::int as views,
        min(created_at) as started,
        max(active_until) as ended,
        (array_agg(path order by created_at))[1] as entry_path,
        (array_agg(referrer order by created_at))[1] as referrer,
        (array_agg(utm_source order by created_at))[1] as utm_source,
        (array_agg(utm_campaign order by created_at))[1] as utm_campaign
      from numbered
      group by visitor_hash, visit_no
    )`;
}

async function kpis(b: Bounds): Promise<Kpis> {
  const [r] = await rows<Record<string, string | number | null>>(sql`
    ${withVisits(b)}
    select
      (select count(distinct visitor_hash) from pv)::int as visitors,
      (select count(*) from pv)::int as pageviews,
      count(*)::int as visits,
      coalesce(avg(views), 0)::float as pages_per_visit,
      coalesce(avg((views = 1)::int), 0)::float as bounce_rate,
      coalesce(avg(extract(epoch from ended - started)), 0)::float as avg_duration
    from visits`);
  return {
    visitors: Number(r.visitors),
    visits: Number(r.visits),
    pageviews: Number(r.pageviews),
    pagesPerVisit: Number(r.pages_per_visit),
    bounceRate: Number(r.bounce_rate),
    avgDurationSec: Number(r.avg_duration),
  };
}

// Whitelisted columns for breakdowns (never interpolate user input into SQL).
const COLUMNS = { country: "country", device: "device", browser: "browser", os: "os", path: "path" } as const;

async function breakdown(b: Bounds, column: keyof typeof COLUMNS, limit = 10): Promise<Row[]> {
  const col = sql.raw(COLUMNS[column]);
  const r = await rows<{ key: string | null; visitors: number; views: number }>(sql`
    select ${col} as key, count(distinct visitor_hash)::int as visitors, count(*)::int as views
    from pageviews
    where created_at >= ${b.start.toISOString()}::timestamptz and created_at < ${b.end.toISOString()}::timestamptz
    group by 1 order by visitors desc, views desc limit ${limit}`);
  return r.map((x) => ({ key: x.key ?? "", visitors: Number(x.visitors), views: Number(x.views) }));
}

async function rangeBounds(range: RangeKey): Promise<{ current: Bounds; previous: Bounds }> {
  const [r] = await rows<{ midnight: string; now: string }>(sql`
    select (date_trunc('day', now() at time zone ${ANALYTICS_TIMEZONE}) at time zone ${ANALYTICS_TIMEZONE}) as midnight,
           now() as now`);
  const now = new Date(r.now);
  const midnight = new Date(r.midnight);
  const day = 86400_000;
  if (range === "today") {
    // Today so far, compared with the same hours yesterday.
    return {
      current: { start: midnight, end: now },
      previous: { start: new Date(midnight.getTime() - day), end: new Date(now.getTime() - day) },
    };
  }
  const days = RANGES[range].days;
  const start = new Date(midnight.getTime() - (days - 1) * day);
  return {
    current: { start, end: now },
    previous: { start: new Date(start.getTime() - days * day), end: start },
  };
}

export async function getAnalytics(range: RangeKey): Promise<Analytics> {
  const { current, previous } = await rangeBounds(range);
  const unit = range === "today" ? "hour" : "day";
  const tz = ANALYTICS_TIMEZONE;
  const span = sql`created_at >= ${current.start.toISOString()}::timestamptz and created_at < ${current.end.toISOString()}::timestamptz`;

  const [cur, prev, series, countries, cities, visitSources, devices, browsers, oses, pages] = await Promise.all([
    kpis(current),
    kpis(previous),
    rows<{ bucket: string; visitors: number; views: number }>(sql`
      select to_char(date_trunc(${unit}, created_at at time zone ${tz}), 'YYYY-MM-DD"T"HH24:MI') as bucket,
             count(distinct visitor_hash)::int as visitors, count(*)::int as views
      from pageviews where ${span}
      group by 1 order by 1`),
    breakdown(current, "country"),
    rows<{ city: string | null; country: string | null; visitors: number; views: number }>(sql`
      select city, country, count(distinct visitor_hash)::int as visitors, count(*)::int as views
      from pageviews where ${span} and city is not null
      group by 1, 2 order by visitors desc, views desc limit 10`),
    rows<{ entry_path: string; referrer: string | null; utm_source: string | null; utm_campaign: string | null; visits: number }>(sql`
      ${withVisits(current)}
      select entry_path, referrer, utm_source, utm_campaign, count(*)::int as visits
      from visits group by 1, 2, 3, 4`),
    breakdown(current, "device", 5),
    breakdown(current, "browser", 8),
    breakdown(current, "os", 8),
    breakdown(current, "path", 15),
  ]);

  const tally = <K extends string>(pairs: Array<[K | null, number]>) => {
    const m = new Map<K, number>();
    for (const [k, n] of pairs) if (k) m.set(k, (m.get(k) ?? 0) + n);
    return [...m.entries()].map(([key, visits]) => ({ key, visits })).sort((a, b) => b.visits - a.visits);
  };

  return {
    range,
    timezone: tz,
    unit,
    current: cur,
    previous: prev,
    series: fillSeries(series, current, unit),
    countries,
    cities: cities.map((c) => ({
      key: c.city ?? "",
      country: c.country ?? "",
      visitors: Number(c.visitors),
      views: Number(c.views),
    })),
    channels: tally(visitSources.map((v) => [channelFor(v.referrer, v.utm_source), Number(v.visits)])),
    referrers: tally(visitSources.map((v) => [v.referrer, Number(v.visits)])).slice(0, 10),
    campaigns: tally(visitSources.map((v) => [v.utm_campaign, Number(v.visits)])).slice(0, 10),
    pages,
    entryPages: tally(visitSources.map((v) => [v.entry_path, Number(v.visits)])).slice(0, 10),
    devices,
    browsers,
    oses,
  };
}

/** Adds empty hours/days so the chart shows gaps as zero instead of skipping them. */
function fillSeries(
  data: Array<{ bucket: string; visitors: number; views: number }>,
  b: Bounds,
  unit: "hour" | "day",
) {
  const byKey = new Map(data.map((d) => [d.bucket, d]));
  const out: Array<{ bucket: string; visitors: number; views: number }> = [];
  const step = unit === "hour" ? 3600_000 : 86400_000;
  // Buckets are local-time labels; walk them as naive UTC dates from the first label.
  const local = (d: Date) => toLocalLabel(d, unit);
  const first = local(b.start);
  const last = local(new Date(b.end.getTime() - 1));
  for (let t = Date.parse(`${first}:00Z`); t <= Date.parse(`${last}:00Z`); t += step) {
    const key = new Date(t).toISOString().slice(0, 16);
    const d = byKey.get(key);
    out.push({ bucket: key, visitors: Number(d?.visitors ?? 0), views: Number(d?.views ?? 0) });
  }
  return out;
}

function toLocalLabel(d: Date, unit: "hour" | "day") {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ANALYTICS_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${unit === "hour" ? parts.hour : "00"}:00`;
}

export type LiveVisitor = { path: string; lastSeen: string; country: string | null; city: string | null; device: string | null };
export type RecentView = {
  path: string;
  at: string;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  channel: Channel;
  referrer: string | null;
};

export async function getLive(): Promise<{ online: LiveVisitor[]; recent: RecentView[] }> {
  const [online, recent] = await Promise.all([
    rows<{ path: string; last_seen: string; country: string | null; city: string | null; device: string | null }>(sql`
      select p.path, p.last_seen, lp.country, lp.city, lp.device
      from presence p
      left join lateral (
        select country, city, device from pageviews
        where visitor_hash = p.visitor_hash order by created_at desc limit 1
      ) lp on true
      where p.last_seen > now() - interval '60 seconds'
      order by p.last_seen desc limit 50`),
    rows<{
      path: string;
      created_at: string;
      country: string | null;
      city: string | null;
      device: string | null;
      browser: string | null;
      referrer: string | null;
      utm_source: string | null;
    }>(sql`
      select path, created_at, country, city, device, browser, referrer, utm_source
      from pageviews order by created_at desc limit 15`),
  ]);
  return {
    online: online.map((o) => ({
      path: o.path,
      lastSeen: new Date(o.last_seen).toISOString(),
      country: o.country,
      city: o.city,
      device: o.device,
    })),
    recent: recent.map((r) => ({
      path: r.path,
      at: new Date(r.created_at).toISOString(),
      country: r.country,
      city: r.city,
      device: r.device,
      browser: r.browser,
      referrer: r.referrer,
      channel: channelFor(r.referrer, r.utm_source),
    })),
  };
}
