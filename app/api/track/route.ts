import { z } from "zod";
import { db, hasDb, pageviews, presence } from "@/lib/db";
import { isBot, visitorHash } from "@/lib/visitors";

const body = z.object({
  type: z.enum(["view", "ping"]),
  path: z.string().max(500),
  referrer: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  if (!hasDb()) return new Response(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return new Response(null, { status: 204 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { type, path, referrer } = parsed.data;
  if (path.startsWith("/admin")) return new Response(null, { status: 204 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "0.0.0.0";
  const hash = visitorHash(ip, ua);
  const now = new Date();

  const writes: Promise<unknown>[] = [
    db()
      .insert(presence)
      .values({ visitorHash: hash, path, lastSeen: now })
      .onConflictDoUpdate({ target: presence.visitorHash, set: { path, lastSeen: now } }),
  ];
  if (type === "view") {
    let ref: string | null = null;
    try {
      // Store only the referring host, and drop self-referrals.
      const host = referrer ? new URL(referrer).host : "";
      ref = host && host !== new URL(req.url).host ? host : null;
    } catch {}
    writes.push(
      db()
        .insert(pageviews)
        .values({
          path,
          visitorHash: hash,
          referrer: ref,
          country: req.headers.get("x-vercel-ip-country"),
        }),
    );
  }
  await Promise.all(writes);
  return new Response(null, { status: 204 });
}
