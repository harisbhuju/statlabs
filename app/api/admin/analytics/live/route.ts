import { getLive } from "@/lib/analytics/queries";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await getLive(), { headers: { "Cache-Control": "no-store" } });
}
