import Link from "next/link";
import { EmptyState, LiveBadge, Tile } from "@/components/bento/Tile";
import { TrendsChart } from "@/components/bento/TrendsChart";
import { VisitorsTile } from "@/components/bento/VisitorsTile";
import { TimeAgo } from "@/components/TimeAgo";
import { listPublished } from "@/lib/posts";
import { readCache } from "@/lib/sources/cache";
import { SITE } from "@/lib/site";

// Regenerated at most every 5 minutes; source refreshes also revalidate "/" on demand.
export const revalidate = 300;

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export default async function Home() {
  const [trends, news, x, latestPosts] = await Promise.all([
    readCache("trends"),
    readCache("news"),
    readCache("x"),
    listPublished(4),
  ]);

  const newsItems = news?.payload.items ?? [];
  const news24h = countSince(newsItems, 86400_000);
  const latestTrend = trends?.payload.points.at(-1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 md:grid-cols-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-6 md:col-span-4">
          <LiveBadge label="Live dashboard" />
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Tracking the road to <span className="text-accent">superintelligence</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted md:text-base">
            Search interest, breaking news and the conversation on X about artificial superintelligence —
            updated around the clock, with a new analysis on the blog every day.
          </p>
          <dl className="mt-6 grid max-w-lg grid-cols-3 gap-3">
            <Stat label="News stories (24h)" value={news24h ? String(news24h) : "—"} />
            <Stat
              label="Search interest"
              value={latestTrend ? String(latestTrend[trends!.payload.terms[0]] ?? "—") : "—"}
              hint="/100"
            />
            <Stat label="Top X posts" value={x ? String(x.payload.posts.length) : "—"} />
          </dl>
        </section>

        <VisitorsTile className="md:col-span-2" />

        {/* Google Trends */}
        <Tile
          title="Google search interest · 90 days"
          className="md:col-span-4"
          updatedAt={trends?.fetchedAt}
          source={trends?.payload.source}
        >
          {trends?.payload.points.length ? (
            <TrendsChart data={trends.payload} />
          ) : (
            <EmptyState>Google Trends data is coming soon.</EmptyState>
          )}
        </Tile>

        {/* Rising searches */}
        <Tile title="Rising searches" className="md:col-span-2">
          {trends?.payload.rising.length ? (
            <ol className="space-y-2 text-sm">
              {trends.payload.rising.map((r, i) => (
                <li key={r.query} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="mr-2 font-mono text-xs text-muted">{i + 1}</span>
                    {r.query}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-accent-2">{r.value}</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState>Rising queries appear once Trends data is connected.</EmptyState>
          )}
        </Tile>

        {/* News */}
        <Tile
          title="Latest news"
          className="md:col-span-3 md:row-span-2"
          updatedAt={news?.fetchedAt}
          source="Google News · Hacker News"
        >
          {newsItems.length ? (
            <ul className="scroll-thin max-h-[560px] space-y-1 overflow-y-auto pr-1">
              {newsItems.map((n) => (
                <li key={n.url}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block rounded-lg px-2 py-2.5 hover:bg-surface-2"
                  >
                    <div className="text-sm leading-snug">{n.title}</div>
                    <div className="mt-1 flex gap-2 text-[11px] text-muted">
                      <span>{n.source}</span>·<TimeAgo iso={n.publishedAt} />
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Fetching the latest superintelligence headlines…</EmptyState>
          )}
        </Tile>

        {/* X */}
        <Tile
          title="Trending on X"
          className="md:col-span-3 md:row-span-2"
          updatedAt={x?.fetchedAt}
          source={x?.payload.source}
        >
          {x?.payload.posts.length ? (
            <div className="flex h-full flex-col gap-3">
              {x.payload.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {x.payload.hashtags.map((h) => (
                    <span key={h.tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      #{h.tag}
                    </span>
                  ))}
                </div>
              )}
              <ul className="scroll-thin max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {x.payload.posts.map((p) => (
                  <li key={p.id}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="block rounded-lg border border-border bg-surface-2/50 p-3 hover:border-accent/40"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">
                          <span className="font-medium">{p.author.name}</span>{" "}
                          <span className="text-muted">@{p.author.handle}</span>
                        </span>
                        <TimeAgo iso={p.createdAt} className="shrink-0 text-muted" />
                      </div>
                      <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-sm leading-snug">{p.text}</p>
                      <div className="mt-2 flex gap-4 font-mono text-[11px] text-muted">
                        <span>♥ {compact.format(p.likes)}</span>
                        <span>⟳ {compact.format(p.reposts)}</span>
                        <span>👁 {compact.format(p.views)}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState>X posts will appear once the X data source is connected.</EmptyState>
          )}
        </Tile>

        {/* Blog */}
        <Tile
          title="From the blog"
          className="md:col-span-6"
          badge={
            <Link href="/blog" className="text-xs text-accent hover:underline">
              All posts →
            </Link>
          }
        >
          {latestPosts.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {latestPosts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="block h-full rounded-xl border border-border bg-surface-2/50 p-4 hover:border-accent/40"
                  >
                    {p.publishedAt && <TimeAgo iso={p.publishedAt.toISOString()} className="text-[11px] text-muted" />}
                    <h3 className="mt-1 line-clamp-2 font-medium leading-snug">{p.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{p.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>The first daily analysis is on its way.</EmptyState>
          )}
        </Tile>
      </div>
    </>
  );
}

function countSince(items: { publishedAt: string }[], windowMs: number) {
  const cutoff = Date.now() - windowMs;
  return items.filter((n) => Date.parse(n.publishedAt) >= cutoff).length;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <dd className="font-mono text-2xl tabular-nums">
        {value}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </dd>
      <dt className="text-[11px] text-muted">{label}</dt>
    </div>
  );
}
