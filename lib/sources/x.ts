import type { XPayload, XPost } from "./types";

interface XProvider {
  name: string;
  enabled(): boolean;
  fetch(): Promise<XPayload>;
}

type TwitterApiIoTweet = {
  id: string;
  url?: string;
  text: string;
  createdAt: string;
  likeCount?: number;
  retweetCount?: number;
  viewCount?: number;
  author: { userName: string; name: string; profilePicture?: string };
};

/** twitterapi.io — pay-per-request third-party X API. Swap providers by adding another adapter. */
const twitterApiIo: XProvider = {
  name: "X (via twitterapi.io)",
  enabled: () => Boolean(process.env.X_API_KEY),
  async fetch() {
    const since = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10);
    const query = `(superintelligence OR "artificial superintelligence" OR #ASI) min_faves:20 -filter:retweets lang:en since:${since}`;
    const res = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?queryType=Top&query=${encodeURIComponent(query)}`,
      { headers: { "X-API-Key": process.env.X_API_KEY! }, cache: "no-store" },
    );
    if (!res.ok) throw new Error(`twitterapi.io responded ${res.status}`);
    const data = (await res.json()) as { tweets?: TwitterApiIoTweet[] };
    const posts: XPost[] = (data.tweets ?? []).map((t) => ({
      id: t.id,
      url: t.url || `https://x.com/${t.author.userName}/status/${t.id}`,
      text: t.text,
      createdAt: new Date(t.createdAt).toISOString(),
      likes: t.likeCount ?? 0,
      reposts: t.retweetCount ?? 0,
      views: t.viewCount ?? 0,
      author: { handle: t.author.userName, name: t.author.name, avatar: t.author.profilePicture },
    }));
    return { source: twitterApiIo.name, posts: posts.slice(0, 12), hashtags: topHashtags(posts) };
  },
};

function topHashtags(posts: XPost[]) {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const m of p.text.matchAll(/#(\w{2,})/g)) {
      const tag = m[1].toLowerCase();
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));
}

const providers = [twitterApiIo];

/** Returns null when no provider is configured. */
export async function fetchX(): Promise<XPayload | null> {
  const provider = providers.find((p) => p.enabled());
  return provider ? provider.fetch() : null;
}
