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

export type XPost = {
  id: string;
  url: string;
  text: string;
  createdAt: string;
  likes: number;
  reposts: number;
  views: number;
  author: { handle: string; name: string; avatar?: string };
};
export type XPayload = {
  source: string;
  posts: XPost[];
  hashtags: Array<{ tag: string; count: number }>;
};

export type CacheKey = "trends" | "news" | "x";
