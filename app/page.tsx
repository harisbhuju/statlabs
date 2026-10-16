import Link from "next/link";
import { EmptyState, LiveLabel, Tile } from "@/components/bento/Tile";
import { TrendsChart } from "@/components/bento/TrendsChart";
import { VisitorsTile } from "@/components/bento/VisitorsTile";
import { TimeAgo } from "@/components/TimeAgo";
import { listPublished } from "@/lib/posts";
import { readCache } from "@/lib/sources/cache";
import { SITE } from "@/lib/site";

// Regenerated at most every 5 minutes; source refreshes also revalidate "/" on demand.
export const revalidate = 300;

const compact = new Intl.NumberFormat("en", { notation: "compact" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function Home() {
  const [trends, news, x, latestPosts] = await Promise.all([
    readCache("trends"),
    readCache("news"),
    readCache("x"),
    listPublished(4),
  ]);

  const newsItems = news?.payload.items ?? [];
  const news24h = countSince(newsItems, 86400_000);
  const primaryTerm = trends?.payload.terms[0];
  const latestTrend = trends?.payload.points.at(-1);
  const [lead, ...morePosts] = latestPosts;

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

      <div className="grid grid-cols-[minmax(0,1fr)] gap-px border border-border bg-border lg:grid-cols-12">
        {/* Masthead lede */}
        <section className="flex min-w-0 flex-col justify-between bg-surface p-5 sm:p-8 lg:col-span-8">
          <div>
            <div className="flex items-center gap-4">
              <span className="eyebrow !text-foreground">
                <span className="mr-3 text-accent">01</span>The Superintelligence Index
              </span>
              <LiveLabel />
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-[44px] leading-[0.98] tracking-[-0.01em] sm:text-[64px]">
              Measuring the world&apos;s attention on <em className="text-accent">superintelligence</em>.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-2">
              Search interest, breaking news and the public conversation about artificial superintelligence —
              tracked continuously, with original analysis published every day.
            </p>
          </div>
          <dl className="mt-10 grid grid-cols-3 border-t border-rule">
            <Figure label="Stories, last 24h" value={newsItems.length ? String(news24h) : "–"} />
            <Figure
              label={`Search interest${primaryTerm ? ` · “${primaryTerm}”` : ""}`}
              value={latestTrend && primaryTerm ? String(latestTrend[primaryTerm] ?? "–") : "–"}
              unit="/100"
            />
            <Figure label="Top posts on X, 48h" value={x ? String(x.payload.posts.length) : "–"} />
          </dl>
        </section>

        <VisitorsTile className="lg:col-span-4" />

        {/* Search interest */}
        <Tile
          index="03"
          title="Search interest"
          meta="Google · 90 days · indexed 0–100"
          className="lg:col-span-8"
          updatedAt={trends?.fetchedAt}
          source={trends?.payload.source}
        >
          {trends?.payload.points.length ? (
            <TrendsChart data={trends.payload} />
          ) : (
            <EmptyState>Search-interest data arrives once Google Trends is connected.</EmptyState>
          )}
        </Tile>

        <Tile index="04" title="Rising searches" meta="Breakout queries" className="lg:col-span-4">
          {trends?.payload.rising.length ? (
            <ol>
              {trends.payload.rising.map((r, i) => (
                <li
                  key={r.query}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-0"
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="num w-5 shrink-0 font-mono text-[11px] text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-[14px]">{r.query}</span>
                  </span>
                  <span className="num shrink-0 font-mono text-[12px] text-accent">{r.value}</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState>Breakout queries appear alongside search-interest data.</EmptyState>
          )}
        </Tile>

        {/* News */}
        <Tile
          index="05"
          title="The wire"
          meta={newsItems.length ? `Latest ${Math.min(newsItems.length, 10)}` : undefined}
          className="lg:col-span-7"
          updatedAt={news?.fetchedAt}
          source="Google News · Hacker News"
        >
          {newsItems.length ? (
            <ol>
              {newsItems.slice(0, 10).map((n, i) => (
                <li key={n.url} className="border-b border-border last:border-0">
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="group grid grid-cols-[2rem_1fr] gap-3 py-3.5"
                  >
                    <span className="num font-display text-[22px] leading-none text-muted">{i + 1}</span>
                    <span>
                      <span className="block text-[15px] leading-snug font-medium group-hover:text-accent">
                        {n.title}
                      </span>
                      <span className="mt-1.5 flex gap-2 font-mono text-[10.5px] uppercase tracking-wider text-muted">
                        <span className="truncate">{n.source}</span>
                        <span aria-hidden>/</span>
                        <TimeAgo iso={n.publishedAt} className="shrink-0" />
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState>The newswire refreshes every thirty minutes.</EmptyState>
          )}
        </Tile>

        {/* X */}
        <Tile
          index="06"
          title="On X"
          meta="Most engaged · 48h"
          className="lg:col-span-5"
          updatedAt={x?.fetchedAt}
          source={x?.payload.source}
        >
          {x?.payload.posts.length ? (
            <div className="flex h-full flex-col">
              {x.payload.hashtags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 border-b border-border pb-3 font-mono text-[11px] text-ink-2">
                  {x.payload.hashtags.map((h) => (
                    <span key={h.tag}>
                      #{h.tag}
                      <span className="ml-1 text-muted">{h.count}</span>
                    </span>
                  ))}
                </div>
              )}
              <ul className="scroll-thin -mr-2 max-h-[600px] overflow-y-auto pr-2">
                {x.payload.posts.map((p) => (
                  <li key={p.id} className="border-b border-border last:border-0">
                    <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="group block py-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13px]">
                          <span className="font-medium">{p.author.name}</span>
                          <span className="ml-1.5 text-muted">@{p.author.handle}</span>
                        </span>
                        <TimeAgo iso={p.createdAt} className="shrink-0 font-mono text-[10.5px] text-muted" />
                      </div>
                      <p className="mt-2 line-clamp-4 whitespace-pre-line text-[14px] leading-relaxed text-ink-2 group-hover:text-foreground">
                        {p.text}
                      </p>
                      <div className="num mt-2.5 flex gap-5 font-mono text-[10.5px] uppercase tracking-wider text-muted">
                        <span>{compact.format(p.likes)} likes</span>
                        <span>{compact.format(p.reposts)} reposts</span>
                        <span>{compact.format(p.views)} views</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState>The most-engaged posts on X appear once the feed is connected.</EmptyState>
          )}
        </Tile>

        {/* Analysis */}
        <Tile
          index="07"
          title="Analysis"
          meta={
            <Link href="/blog" className="link-underline !text-foreground">
              All analysis
            </Link>
          }
          className="lg:col-span-12"
        >
          {lead ? (
            <div className="grid gap-8 lg:grid-cols-12">
              <Link href={`/blog/${lead.slug}`} className="group lg:col-span-7">
                <div className="eyebrow">
                  Latest{lead.publishedAt && <> · {dateFmt.format(lead.publishedAt)}</>}
                </div>
                <h3 className="mt-3 font-display text-[34px] leading-[1.02] group-hover:text-accent sm:text-[42px]">
                  {lead.title}
                </h3>
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">{lead.excerpt}</p>
                <span className="mt-5 inline-block text-[13px] font-medium link-underline">Read the analysis</span>
              </Link>
              {morePosts.length > 0 && (
                <ul className="lg:col-span-5 lg:border-l lg:border-border lg:pl-8">
                  {morePosts.map((p) => (
                    <li key={p.id} className="border-b border-border py-4 first:pt-0 last:border-0">
                      <Link href={`/blog/${p.slug}`} className="group block">
                        {p.publishedAt && <div className="eyebrow">{dateFmt.format(p.publishedAt)}</div>}
                        <h4 className="mt-1.5 font-display text-[22px] leading-tight group-hover:text-accent">
                          {p.title}
                        </h4>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

function Figure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col-reverse justify-end border-r border-border pt-4 pr-4 last:border-0 [&:not(:first-child)]:pl-4">
      <dt className="eyebrow mt-2 leading-snug">{label}</dt>
      <dd className="num font-display text-[44px] leading-none sm:text-[56px]">
        {value}
        {unit && <span className="ml-1 font-mono text-xs text-muted">{unit}</span>}
      </dd>
    </div>
  );
}
