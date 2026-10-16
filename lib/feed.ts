import type { Post } from "@/lib/db";
import type { NewsItem, XPost } from "@/lib/sources/types";
import { classifyTopic, type Topic } from "@/lib/topics";

export type FeedKind = "news" | "x" | "analysis";

export type FeedItem = {
  id: string;
  kind: FeedKind;
  /** Narrower source bucket used by the sidebar (Hacker News is news, but counted on its own). */
  bucket: "news" | "hn" | "x" | "analysis";
  title: string;
  text?: string;
  url: string;
  source: string;
  publishedAt: string;
  topic: Topic;
  metrics?: { likes: number; reposts: number; views: number };
  author?: { name: string; handle: string };
  readMinutes?: number;
  sourceCount?: number;
};

export function buildFeed({ news, x, posts }: { news: NewsItem[]; x: XPost[]; posts: Post[] }): FeedItem[] {
  const items: FeedItem[] = [
    ...posts.map((p) => ({
      id: `post-${p.id}`,
      kind: "analysis" as const,
      bucket: "analysis" as const,
      title: p.title,
      text: p.excerpt,
      url: `/blog/${p.slug}`,
      source: "StatLabs analysis",
      publishedAt: (p.publishedAt ?? p.updatedAt).toISOString(),
      topic: classifyTopic(`${p.title} ${p.tags.join(" ")}`),
      readMinutes: Math.max(1, Math.round(p.content.split(/\s+/).length / 230)),
      sourceCount: p.sources.length,
    })),
    ...news.map((n) => ({
      id: `news-${n.url}`,
      kind: "news" as const,
      bucket: n.source === "Hacker News" ? ("hn" as const) : ("news" as const),
      title: n.title,
      url: n.url,
      source: n.source,
      publishedAt: n.publishedAt,
      topic: classifyTopic(n.title),
    })),
    ...x.map((p) => ({
      id: `x-${p.id}`,
      kind: "x" as const,
      bucket: "x" as const,
      title: p.text,
      text: p.text,
      url: p.url,
      source: "X",
      publishedAt: p.createdAt,
      topic: classifyTopic(p.text),
      metrics: { likes: p.likes, reposts: p.reposts, views: p.views },
      author: { name: p.author.name, handle: p.author.handle },
    })),
  ];
  return items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
