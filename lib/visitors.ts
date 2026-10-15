import { createHash } from "node:crypto";
import { gt, lt, sql } from "drizzle-orm";
import { db, hasDb, pageviews, presence } from "@/lib/db";

export const ONLINE_WINDOW_MS = 60_000;

const BOT_UA = /bot|crawler|spider|crawling|preview|headless|lighthouse|monitor/i;

export function isBot(ua: string) {
  return !ua || BOT_UA.test(ua);
}

/**
 * Anonymous visitor id: sha256(ip + ua + day + secret). Rotates daily and stores no raw IP,
 * so no cookies or consent banner are needed.
 */
export function visitorHash(ip: string, ua: string) {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}|${ua}|${day}|${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}

export type VisitorStats = { online: number; today: number; total: number; pageviews: number };

export async function getVisitorStats(): Promise<VisitorStats> {
  const empty = { online: 0, today: 0, total: 0, pageviews: 0 };
  if (!hasDb()) return empty;
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  try {
    const [[online], [counts]] = await Promise.all([
      db()
        .select({ n: sql<number>`count(*)::int` })
        .from(presence)
        .where(gt(presence.lastSeen, new Date(Date.now() - ONLINE_WINDOW_MS))),
      db()
        .select({
          total: sql<number>`count(distinct ${pageviews.visitorHash})::int`,
          pageviews: sql<number>`count(*)::int`,
          today: sql<number>`count(distinct ${pageviews.visitorHash}) filter (where ${pageviews.createdAt} >= ${startOfDay.toISOString()})::int`,
        })
        .from(pageviews),
    ]);
    return { online: online.n, today: counts.today, total: counts.total, pageviews: counts.pageviews };
  } catch (err) {
    console.error("getVisitorStats failed", err);
    return empty;
  }
}

export async function prunePresence() {
  await db()
    .delete(presence)
    .where(lt(presence.lastSeen, new Date(Date.now() - 10 * ONLINE_WINDOW_MS)));
}
