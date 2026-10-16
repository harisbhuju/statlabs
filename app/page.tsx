import Link from "next/link";
import { Feed } from "@/components/home/Feed";
import { SearchInterestCard, SearchInterestPending } from "@/components/home/SearchInterestCard";
import { TimeAgo } from "@/components/TimeAgo";
import { getContent } from "@/lib/content";
import { buildFeed } from "@/lib/feed";
import { countPublished, listPublished } from "@/lib/posts";
import { readCache } from "@/lib/sources/cache";
import { summarizeTrends } from "@/lib/sources/trendsSummary";
import { SITE } from "@/lib/site";

// Regenerated at most every 5 minutes; source refreshes also revalidate "/" on demand.
export const revalidate = 300;

export default async function Home() {
  const [trends, news, x, mastodon, posts, postCount, site, c] = await Promise.all([
    readCache("trends"),
    readCache("news"),
    readCache("x"),
    readCache("mastodon"),
    listPublished(12),
    countPublished(),
    getContent("site"),
    getContent("home"),
  ]);

  const newsItems = news?.payload.items ?? [];
  const social = [...(x?.payload.posts ?? []), ...(mastodon?.payload.posts ?? [])];
  const summary = trends ? summarizeTrends(trends.payload) : null;
  const feed = buildFeed({ news: newsItems, social, posts });
  const stories24h = countSince(newsItems, 86400_000);
  const latest = posts[0];
  const updatedAt = [news?.fetchedAt, x?.fetchedAt, mastodon?.fetchedAt, trends?.fetchedAt]
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: site.description,
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:py-16">
        <div className="min-w-0">
          {updatedAt && (
            <div className="flex items-center gap-2 font-mono text-[11.5px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Updated <TimeAgo iso={updatedAt.toISOString()} />
            </div>
          )}
          <h1 className="mt-4 text-[44px] font-extrabold leading-[0.98] tracking-[-0.045em] [text-wrap:balance] sm:text-[60px] xl:text-[68px]">
            {c.heading} <span className="text-accent">{c.highlight}</span>
          </h1>
          <p className="mt-5 max-w-[34em] text-[16.5px] leading-relaxed text-ink-2">{c.intro}</p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link href={latest ? `/blog/${latest.slug}` : "/blog"} className="btn-primary h-10 px-5 text-[14px]">
              {c.primaryButton}
            </Link>
            <Link href="/what-is-superintelligence" className="btn h-10 px-5 text-[14px]">
              {c.secondaryButton}
            </Link>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <HeroStat value={stories24h} label={stories24h === 1 ? "story in the last 24h" : "stories in the last 24h"} />
            <HeroStat value={feed.length} label="items in the feed" />
            <HeroStat value={postCount} label={postCount === 1 ? "briefing published" : "briefings published"} />
          </dl>
        </div>

        <div className="min-w-0">{summary ? <SearchInterestCard summary={summary} /> : <SearchInterestPending />}</div>
      </section>

      <Feed items={feed} rising={summary?.rising ?? []} />
    </div>
  );
}

function countSince(items: { publishedAt: string }[], windowMs: number) {
  const cutoff = Date.now() - windowMs;
  return items.filter((n) => Date.parse(n.publishedAt) >= cutoff).length;
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="num text-[24px] font-bold tracking-[-0.02em]">{value}</dd>
      <span className="text-[13px] text-muted" aria-hidden>
        {label}
      </span>
    </div>
  );
}
