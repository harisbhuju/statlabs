import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { VISIT_GAP_MS } from "@/lib/analytics/config";
import { parseUserAgent } from "@/lib/analytics/ua";
import { db, hasDb, pageviews, presence } from "@/lib/db";
import { isBot, visitorHash } from "@/lib/visitors";

const DUPLICATE_WINDOW_MS = 10_000;

const utmValue = z.string().max(100).optional();
const body = z.object({
  type: z.enum(["view", "ping"]),
  path: z.string().max(500),
  referrer: z.string().max(500).optional(),
  reload: z.boolean().optional(),
  utm: z.object({ source: utmValue, medium: utmValue, campaign: utmValue }).optional(),
});

function header(req: Request, name: string) {
  const v = req.headers.get(name);
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function POST(req: Request) {
  if (!hasDb()) return new Response(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return new Response(null, { status: 204 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { type, path, referrer, reload, utm } = parsed.data;
  if (path.startsWith("/admin")) return new Response(null, { status: 204 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "0.0.0.0";
  const hash = visitorHash(ip, ua);
  const now = new Date();

  await db()
    .insert(presence)
    .values({ visitorHash: hash, path, lastSeen: now })
    .onConflictDoUpdate({ target: presence.visitorHash, set: { path, lastSeen: now } });

  const [latest] = await db()
    .select({ id: pageviews.id, path: pageviews.path, createdAt: pageviews.createdAt })
    .from(pageviews)
    .where(eq(pageviews.visitorHash, hash))
    .orderBy(desc(pageviews.createdAt))
    .limit(1);

  // Heartbeats, reloads of a page already counted in this visit, and double-fires only extend the
  // current page view (used for visit duration). A reload after a long break still counts.
  const sincePrev = latest ? now.getTime() - latest.createdAt.getTime() : Infinity;
  const samePage = latest?.path === path;
  const isReloadInVisit = Boolean(reload) && samePage && sincePrev < VISIT_GAP_MS;
  const isDuplicate = samePage && sincePrev < DUPLICATE_WINDOW_MS;
  if (type === "ping" || isReloadInVisit || isDuplicate) {
    if (latest) {
      await db()
        .update(pageviews)
        .set({ engagedUntil: now })
        .where(and(eq(pageviews.id, latest.id), gt(pageviews.createdAt, new Date(now.getTime() - 6 * 3600_000))));
    }
    return new Response(null, { status: 204 });
  }

  let ref: string | null = null;
  try {
    // Store only the referring host, and drop self-referrals.
    const host = referrer ? new URL(referrer).host : "";
    ref = host && host !== new URL(req.url).host ? host : null;
  } catch {}

  const { device, browser, os } = parseUserAgent(ua);
  await db()
    .insert(pageviews)
    .values({
      path,
      visitorHash: hash,
      referrer: ref,
      country: req.headers.get("x-vercel-ip-country"),
      region: header(req, "x-vercel-ip-country-region"),
      city: header(req, "x-vercel-ip-city"),
      device,
      browser,
      os,
      utmSource: utm?.source?.toLowerCase() ?? null,
      utmMedium: utm?.medium?.toLowerCase() ?? null,
      utmCampaign: utm?.campaign ?? null,
    });
  return new Response(null, { status: 204 });
}
