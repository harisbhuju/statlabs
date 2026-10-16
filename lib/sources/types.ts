export type TrendsPayload = {
  source: string;
  terms: string[];
  points: Array<{ date: string } & Record<string, number | string>>;
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
