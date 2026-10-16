export type TrendPoint = { date: string } & Record<string, number | string>;

export type TrendsPayload = {
  /** Bumped when the shape or the searched terms change, so old cached data is replaced. */
  version?: number;
  source: string;
  /** The main term, searched on its own so it has its own 0–100 scale. */
  terms: string[];
  points: TrendPoint[];
  /** The main term and a much bigger reference term (e.g. "AI") on one shared scale. */
  comparison?: { terms: string[]; points: TrendPoint[] };
  rising: Array<{ query: string; value: string }>;
};

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};
export type NewsPayload = { items: NewsItem[] };

export type SocialNetwork = "X" | "Mastodon";

export type SocialPost = {
  id: string;
  network: SocialNetwork;
  url: string;
  text: string;
  createdAt: string;
  likes: number;
  reposts: number;
  /** X only; Mastodon does not report views. */
  views: number;
  replies?: number;
  author: { handle: string; name: string; avatar?: string };
};

export type SocialPayload = {
  source: string;
  posts: SocialPost[];
  hashtags: Array<{ tag: string; count: number }>;
};
export type XPayload = SocialPayload;
export type MastodonPayload = SocialPayload;

export type CacheKey = "trends" | "news" | "x" | "mastodon";
