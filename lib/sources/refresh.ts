import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, hasDb, sourceCache } from "@/lib/db";
import { writeCache } from "./cache";
import { fetchMastodon } from "./mastodon";
import { fetchNews } from "./news";
import { fetchTrends } from "./trends";
import { fetchX } from "./x";
import type { CacheKey } from "./types";

/** How long each source stays fresh. Keeps paid API usage (X, Trends) low. */
const TTL_MS: Record<CacheKey, number> = {
  news: 30 * 60_000,
  x: 60 * 60_000,
  mastodon: 30 * 60_000,
  // Once a day keeps SerpApi within its free 100 searches/month (2 searches per refresh).
  trends: 24 * 60 * 60_000,
};

const fetchers = {
  news: fetchNews,
  x: fetchX,
  mastodon: fetchMastodon,
  trends: fetchTrends,
} as const;

/**
 * Claims a stale cache row by bumping fetched_at, so concurrent callers don't all hit the
 * paid APIs. Returns true when this caller should refresh.
 */
async function claim(key: CacheKey, force: boolean) {
  const [existing] = await db()
    .select({ key: sourceCache.key })
    .from(sourceCache)
    .where(eq(sourceCache.key, key));
  if (!existing) return true;
  if (force) return true;
  const claimed = await db()
    .update(sourceCache)
    .set({ fetchedAt: new Date() })
    .where(
      and(eq(sourceCache.key, key), lt(sourceCache.fetchedAt, new Date(Date.now() - TTL_MS[key]))),
    )
    .returning({ key: sourceCache.key });
  return claimed.length > 0;
}

async function refreshOne(key: CacheKey, force: boolean) {
  if (!(await claim(key, force))) return "fresh";
  const payload = await fetchers[key]();
  if (!payload) return "not-configured";
  // The fetchers map guarantees payload matches key.
  await writeCache(key, payload as never);
  return "updated";
}

export async function refreshSources({ force = false } = {}) {
  if (!hasDb()) return {};
  const keys = Object.keys(fetchers) as CacheKey[];
  const results = await Promise.allSettled(keys.map((k) => refreshOne(k, force)));
  const summary = Object.fromEntries(
    keys.map((k, i) => {
      const r = results[i];
      if (r.status === "rejected") console.error(`refresh ${k} failed`, r.reason);
      return [k, r.status === "fulfilled" ? r.value : `error: ${String(r.reason)}`];
    }),
  );
  if (Object.values(summary).includes("updated")) revalidatePath("/");
  return summary;
}
