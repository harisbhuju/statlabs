import type { MastodonPayload, SocialPost } from "./types";
import { topHashtags } from "./x";

// Hashtag timelines are public on Mastodon: no account or key needed. mastodon.social sees posts from
// across the network, so one server is enough.
const SERVER = "https://mastodon.social";
const TAGS = ["superintelligence", "agi", "aisafety"];
const MAX_AGE_MS = 3 * 86400_000;
const MIN_TEXT_LENGTH = 40;
const LIMIT = 12;

type Status = {
  id: string;
  uri: string;
  url: string | null;
  created_at: string;
  language: string | null;
  visibility: string;
  sensitive: boolean;
  spoiler_text: string;
  content: string;
  favourites_count: number;
  reblogs_count: number;
  replies_count: number;
  account: { acct: string; username: string; display_name: string; avatar: string; bot: boolean; url: string };
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Mastodon returns post bodies as HTML; turn them into plain text with line breaks kept. */
export function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[code.toLowerCase()] ?? m;
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchTag(tag: string): Promise<Status[]> {
  const res = await fetch(`${SERVER}/api/v1/timelines/tag/${tag}?limit=40`, {
    headers: { "User-Agent": "StatLabs (+https://statlabs.si)", Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`mastodon #${tag} responded ${res.status}`);
  return (await res.json()) as Status[];
}

export async function fetchMastodon(): Promise<MastodonPayload> {
  const results = await Promise.allSettled(TAGS.map(fetchTag));
  if (results.every((r) => r.status === "rejected")) {
    throw new Error(`Mastodon unavailable: ${(results[0] as PromiseRejectedResult).reason}`);
  }

  const cutoff = Date.now() - MAX_AGE_MS;
  const seen = new Set<string>();
  const ranked: Array<{ post: SocialPost; score: number }> = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const s of r.value) {
      if (seen.has(s.uri)) continue;
      seen.add(s.uri);
      if (s.visibility !== "public" || s.sensitive || s.spoiler_text || s.account.bot) continue;
      if (s.language && s.language !== "en") continue;
      if (Date.parse(s.created_at) < cutoff) continue;
      const text = htmlToText(s.content);
      if (text.length < MIN_TEXT_LENGTH) continue;
      const post: SocialPost = {
        id: s.uri,
        network: "Mastodon",
        url: s.url ?? s.uri,
        text,
        createdAt: new Date(s.created_at).toISOString(),
        likes: s.favourites_count,
        reposts: s.reblogs_count,
        replies: s.replies_count,
        views: 0,
        author: {
          name: s.account.display_name || s.account.username,
          // Local accounts have no "@server" part; add it so every handle is complete.
          handle: s.account.acct.includes("@") ? s.account.acct : `${s.account.acct}@mastodon.social`,
          avatar: s.account.avatar,
        },
      };
      ranked.push({ post, score: s.favourites_count + 2 * s.reblogs_count });
    }
  }

  const top = ranked
    .sort((a, b) => b.score - a.score || Date.parse(b.post.createdAt) - Date.parse(a.post.createdAt))
    .slice(0, LIMIT)
    .map((r) => r.post);
  return { source: "Mastodon (#superintelligence, #agi, #aisafety)", posts: top, hashtags: topHashtags(top) };
}
