"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TimeAgo } from "@/components/TimeAgo";
import { useVisitorStats } from "@/components/useVisitorStats";
import type { FeedItem } from "@/lib/feed";
import { TOPICS, type Topic } from "@/lib/topics";

type Bucket = "all" | FeedItem["bucket"];

const BUCKETS: Array<{ id: Bucket; label: string; pill: string }> = [
  { id: "all", label: "Everything", pill: "All" },
  { id: "news", label: "News", pill: "News" },
  { id: "x", label: "Posts on X", pill: "X posts" },
  { id: "hn", label: "Hacker News", pill: "Hacker News" },
  { id: "analysis", label: "StatLabs analysis", pill: "Analysis" },
];

const PAGE = 24;
const compact = new Intl.NumberFormat("en", { notation: "compact" });
const fmt = new Intl.NumberFormat("en");

function initials(source: string) {
  const clean = source.replace(/^www\./i, "").replace(/\.(com|net|org|in|io|co|news)$/i, "");
  const words = clean.split(/[\s.-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : clean.slice(0, 2)).toUpperCase();
}

export function Feed({
  items,
  rising,
  xConnected,
}: {
  items: FeedItem[];
  rising: Array<{ query: string; value: string }>;
  xConnected: boolean;
}) {
  const [bucket, setBucket] = useState<Bucket>("all");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const bucketCounts = useMemo(() => {
    const c: Record<Bucket, number> = { all: items.length, news: 0, hn: 0, x: 0, analysis: 0 };
    for (const it of items) c[it.bucket]++;
    return c;
  }, [items]);
  const topicCounts = useMemo(() => {
    const c = new Map<Topic, number>();
    for (const it of items) c.set(it.topic, (c.get(it.topic) ?? 0) + 1);
    return TOPICS.filter((t) => c.get(t)).map((t) => [t, c.get(t)!] as const);
  }, [items]);

  const visible = items.filter((it) => (bucket === "all" || it.bucket === bucket) && (!topic || it.topic === topic));
  const buckets = BUCKETS.filter((b) => b.id === "all" || bucketCounts[b.id] > 0);

  const pickBucket = (b: Bucket) => {
    setBucket(b);
    setLimit(PAGE);
  };
  const pickTopic = (t: Topic | null) => {
    setTopic((cur) => (cur === t ? null : t));
    setLimit(PAGE);
  };

  return (
    <section id="feed" className="grid scroll-mt-20 gap-7 border-t border-border pt-7 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="order-last flex flex-col gap-5 lg:order-none lg:sticky lg:top-20 lg:self-start" aria-label="Filter the feed">
        <RailGroup title="Feed" className="hidden lg:block">
          {buckets.map((b) => (
            <RailButton key={b.id} active={bucket === b.id} onClick={() => pickBucket(b.id)} count={bucketCounts[b.id]}>
              {b.label}
            </RailButton>
          ))}
        </RailGroup>
        {topicCounts.length > 1 && (
          <RailGroup title="Topics" note="Tagged automatically" className="hidden lg:block">
            {topicCounts.map(([t, count]) => (
              <RailButton key={t} active={topic === t} onClick={() => pickTopic(t)} count={count}>
                {t}
              </RailButton>
            ))}
          </RailGroup>
        )}
        <ReadersBox />
        {rising.length > 0 && (
          <div className="card p-3.5">
            <h3 className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">Rising searches</h3>
            <ol className="mt-1.5">
              {rising.slice(0, 5).map((r, i) => (
                <li key={r.query} className="flex gap-2.5 border-t border-border py-2 text-[13px] first:border-0">
                  <span className="num w-3 shrink-0 pt-0.5 font-mono text-[11px] text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">{r.query}</span>
                  <span className="whitespace-nowrap font-mono text-[11px] text-accent">{r.value}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {buckets.map((b) => (
            <button key={b.id} type="button" className="pill" aria-pressed={bucket === b.id} onClick={() => pickBucket(b.id)}>
              {b.pill} <span className="num font-mono text-[11px] text-muted">{bucketCounts[b.id]}</span>
            </button>
          ))}
          {topic && (
            <button type="button" className="pill hidden lg:inline-flex" aria-pressed onClick={() => pickTopic(null)}>
              {topic} <span aria-hidden>×</span>
              <span className="sr-only">Clear topic filter</span>
            </button>
          )}
        </div>
        {topicCounts.length > 1 && (
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" role="group" aria-label="Topics">
            {topicCounts.map(([t, count]) => (
              <button
                key={t}
                type="button"
                className="pill h-8 shrink-0 text-[12.5px]"
                aria-pressed={topic === t}
                onClick={() => pickTopic(t)}
              >
                {t} <span className="num font-mono text-[11px] text-muted">{count}</span>
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <div className="card grid h-48 place-items-center p-6 text-center text-[14px] text-muted">
            Nothing here yet. New stories arrive every 30 minutes.
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {visible.slice(0, limit).map((it) => (
              <FeedCard key={it.id} item={it} />
            ))}
          </div>
        )}

        {visible.length > limit && (
          <div className="mt-2 flex justify-center">
            <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE)}>
              Show more <span className="num font-mono text-[11px] text-muted">{visible.length - limit} left</span>
            </button>
          </div>
        )}

        {!xConnected && (
          <p className="mt-6 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-3 text-[13px] text-muted">
            Posts from X will appear in this feed once the X data source is connected.
          </p>
        )}
      </div>
    </section>
  );
}

function RailGroup({
  title,
  note,
  className = "",
  children,
}: {
  title: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h3 className="mb-1.5 flex items-baseline justify-between px-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
        {title}
        {note && <span className="normal-case tracking-normal">{note}</span>}
      </h3>
      <div className="grid gap-0.5">{children}</div>
    </div>
  );
}

function RailButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition-colors ${
        active ? "bg-surface font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)]" : "text-ink-2 hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      <span className="min-w-0 truncate">{children}</span>
      <span className="num font-mono text-[11.5px] text-muted">{count}</span>
    </button>
  );
}

function ReadersBox() {
  const stats = useVisitorStats();
  const show = (n?: number) => (stats ? fmt.format(n ?? 0) : "–");
  return (
    <div className="card p-3.5">
      <h3 className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
        Readers
        <span className="flex items-center gap-1.5 normal-case tracking-normal text-live">
          <span className="live-dot" aria-hidden />
          Live
        </span>
      </h3>
      <div className="num mt-2 text-[40px] font-extrabold leading-none tracking-[-0.04em]">{show(stats?.online)}</div>
      <div className="mt-1 text-[12.5px] text-muted">reading right now</div>
      <dl className="mt-3.5 grid grid-cols-3 gap-2 border-t border-border pt-3">
        {(
          [
            ["today", stats?.today],
            ["all time", stats?.total],
            ["views", stats?.pageviews],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="font-mono text-[10.5px] text-muted">{label}</dt>
            <dd className="num text-[16px] font-semibold">{show(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const base = "card mb-4 block break-inside-avoid p-4 transition-[border-color,transform] hover:-translate-y-px hover:border-border-strong";

  if (item.kind === "analysis") {
    return (
      <Link href={item.url} className={`${base} !border-foreground`}>
        <div className="font-mono text-[11.5px] text-accent">
          ◆ StatLabs analysis · <TimeAgo iso={item.publishedAt} />
        </div>
        <h3 className="mt-2.5 text-[20px] font-bold leading-tight tracking-[-0.02em] [text-wrap:pretty]">{item.title}</h3>
        {item.text && <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">{item.text}</p>}
        <div className="mt-3 grid gap-0.5 font-mono text-[12px] text-muted">
          {item.sourceCount ? (
            <div>
              Sources <b className="font-medium text-foreground">{item.sourceCount}</b>
            </div>
          ) : null}
          <div>
            Reading time <b className="font-medium text-foreground">{item.readMinutes} min</b>
          </div>
        </div>
        <CardFoot left={item.topic} right="Read →" />
      </Link>
    );
  }

  if (item.kind === "x") {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className={base}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-white">
            {initials(item.author!.name)}
          </span>
          <div className="min-w-0 leading-tight">
            <b className="block truncate text-[13px] font-semibold">{item.author!.name}</b>
            <span className="font-mono text-[11.5px] text-muted">
              @{item.author!.handle} · <TimeAgo iso={item.publishedAt} />
            </span>
          </div>
        </div>
        <p className="mt-3 line-clamp-6 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{item.text}</p>
        <CardFoot
          left={`${compact.format(item.metrics!.likes)} likes · ${compact.format(item.metrics!.reposts)} reposts · ${compact.format(item.metrics!.views)} views`}
          right="X"
        />
      </a>
    );
  }

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className={base}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-[11px] font-bold">
          {initials(item.source)}
        </span>
        <div className="min-w-0 leading-tight">
          <b className="block truncate text-[13px] font-semibold">{item.source}</b>
          <TimeAgo iso={item.publishedAt} className="font-mono text-[11.5px] text-muted" />
        </div>
      </div>
      <h3 className="mt-3 text-[16px] font-semibold leading-snug tracking-[-0.01em] [text-wrap:pretty]">{item.title}</h3>
      <CardFoot left={`${item.bucket === "hn" ? "Hacker News" : "News"} · ${item.topic}`} right="↗" />
    </a>
  );
}

function CardFoot({ left, right }: { left: string; right: string }) {
  return (
    <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-border pt-2.5 font-mono text-[11.5px] text-muted">
      <span className="min-w-0 truncate">{left}</span>
      <span className="shrink-0">{right}</span>
    </div>
  );
}
