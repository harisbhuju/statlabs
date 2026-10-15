import { eq } from "drizzle-orm";
import { db, hasDb, sourceCache } from "@/lib/db";
import type { CacheKey, NewsPayload, TrendsPayload, XPayload } from "./types";

type PayloadMap = { trends: TrendsPayload; news: NewsPayload; x: XPayload };
export type Cached<K extends CacheKey> = { payload: PayloadMap[K]; fetchedAt: Date } | null;

export async function readCache<K extends CacheKey>(key: K): Promise<Cached<K>> {
  if (!hasDb()) return null;
  try {
    const [row] = await db().select().from(sourceCache).where(eq(sourceCache.key, key));
    return row ? { payload: row.payload as PayloadMap[K], fetchedAt: row.fetchedAt } : null;
  } catch (err) {
    console.error(`readCache(${key}) failed`, err);
    return null;
  }
}

export async function writeCache<K extends CacheKey>(key: K, payload: PayloadMap[K]) {
  const fetchedAt = new Date();
  await db()
    .insert(sourceCache)
    .values({ key, payload, fetchedAt })
    .onConflictDoUpdate({ target: sourceCache.key, set: { payload, fetchedAt } });
}
