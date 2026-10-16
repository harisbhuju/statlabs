import type { Post } from "@/lib/db";
import type { NewsItem, SocialNetwork, SocialPost } from "@/lib/sources/types";
import { classifyTopic, type Topic } from "@/lib/topics";

export type FeedKind = "news" | "social" | "analysis";

export type FeedItem = {
  id: string;
  kind: FeedKind;
  /** Narrower source bucket used by the sidebar (Hacker News is news, but counted on its own). */
  bucket: "news" | "hn" | "x" | "mastodon" | "analysis";
  title: string;
  text?: string;
  url: string;
  source: string;
  network?: SocialNetwork;
  publishedAt: string;
  topic: Topic;
  metrics?: { likes: number; reposts: number; views: number; replies?: number };
  author?: { name: string; handle: string };
  readMinutes?: number;
  sourceCount?: number;
};

function socialItem(p: SocialPost): FeedItem {
  return {
    id: `${p.network}-${p.id}`,
    kind: "social",
    bucket: p.network === "X" ? "x" : "mastodon",
    title: p.text,
    text: p.text,
    url: p.url,
    source: p.network,
    network: p.network,
    publishedAt: p.createdAt,
    topic: classifyTopic(p.text),
    metrics: { likes: p.likes, reposts: p.reposts, views: p.views, replies: p.replies },
    author: { name: p.author.name, handle: p.author.handle },
  };
}

export function buildFeed({
  news,
  social,
  posts,
}: {
  news: NewsItem[];
  social: SocialPost[];
  posts: Post[];
}): FeedItem[] {
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
    ...social.map(socialItem),
  ];
  return items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
