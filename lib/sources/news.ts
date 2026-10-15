import { XMLParser } from "fast-xml-parser";
import type { NewsItem, NewsPayload } from "./types";

const QUERY = 'superintelligence OR "artificial superintelligence" OR "superintelligent AI" when:7d';

async function googleNews(): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetch(url, { cache: "no-store" }).then((r) => r.text());
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
  const raw = parsed?.rss?.channel?.item ?? [];
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw];
  return items.map((it) => {
    const src = it.source as string | { "#text": string } | undefined;
    const source = typeof src === "string" ? src : (src?.["#text"] ?? "Google News");
    // Google News titles end with " - Source"; strip it since the source is shown separately.
    const title = String(it.title ?? "");
    const suffix = ` - ${source}`;
    return {
      title: title.endsWith(suffix) ? title.slice(0, -suffix.length) : title,
      url: String(it.link),
      source,
      publishedAt: new Date(String(it.pubDate)).toISOString(),
    };
  });
}

type HnHit = { title: string; url?: string; objectID: string; created_at: string };

async function hackerNews(): Promise<NewsItem[]> {
  const url =
    "https://hn.algolia.com/api/v1/search_by_date?query=superintelligence&tags=story&numericFilters=points%3E5";
  const data = (await fetch(url, { cache: "no-store" }).then((r) => r.json())) as { hits?: HnHit[] };
  return (data.hits ?? []).map((h) => ({
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: "Hacker News",
    publishedAt: h.created_at,
  }));
}

export async function fetchNews(): Promise<NewsPayload> {
  const results = await Promise.allSettled([googleNews(), hackerNews()]);
  const seen = new Set<string>();
  const items = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((it) => it.title && !Number.isNaN(Date.parse(it.publishedAt)))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .filter((it) => {
      const k = it.title.toLowerCase().slice(0, 60);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 20);
  if (!items.length) throw new Error("No news sources returned items");
  return { items };
}
