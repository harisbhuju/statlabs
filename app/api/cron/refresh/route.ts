import { hasValidCronSecret } from "@/lib/auth";
import { refreshSources } from "@/lib/sources/refresh";

export const maxDuration = 60;

/**
 * Called by Vercel Cron (sends `Authorization: Bearer $CRON_SECRET`) or manually.
 * `?force=1` ignores TTLs. Sources also refresh lazily from /api/stats/visitors traffic.
 */
export async function GET(req: Request) {
  if (!hasValidCronSecret(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const force = new URL(req.url).searchParams.get("force") === "1";
  return Response.json(await refreshSources({ force }));
}
