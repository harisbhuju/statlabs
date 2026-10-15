import { after } from "next/server";
import { hasDb } from "@/lib/db";
import { refreshSources } from "@/lib/sources/refresh";
import { getVisitorStats, prunePresence } from "@/lib/visitors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const stats = await getVisitorStats();
  // Visitor polling doubles as a lazy scheduler: stale sources refresh in the background,
  // so the dashboard stays live without needing sub-daily cron jobs.
  if (hasDb()) {
    after(async () => {
      await Promise.allSettled([refreshSources(), Math.random() < 0.05 ? prunePresence() : null]);
    });
  }
  return Response.json(stats, { headers: { "Cache-Control": "no-store" } });
}
