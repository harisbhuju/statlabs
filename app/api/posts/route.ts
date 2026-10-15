import { desc } from "drizzle-orm";
import { canWritePosts } from "@/lib/auth";
import { db, hasDb, posts } from "@/lib/db";
import { listPublished, postInput, slugify, uniqueSlug } from "@/lib/posts";
import { revalidatePosts } from "@/lib/revalidate";

/**
 * GET  /api/posts?limit=30            → published posts (public; used by the daily agent to avoid repeats)
 * GET  /api/posts?status=all          → all posts incl. drafts (admin or API key)
 * POST /api/posts                     → create (admin session or `Authorization: Bearer $CMS_API_KEY`)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
  if (url.searchParams.get("status") === "all") {
    if (!(await canWritePosts(req))) return Response.json({ error: "unauthorized" }, { status: 401 });
    const rows = await db().select().from(posts).orderBy(desc(posts.updatedAt)).limit(limit);
    return Response.json({ posts: rows });
  }
  const rows = await listPublished(limit);
  return Response.json({
    posts: rows.map(({ id, slug, title, excerpt, tags, publishedAt }) => ({
      id,
      slug,
      title,
      excerpt,
      tags,
      publishedAt,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await canWritePosts(req))) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!hasDb()) return Response.json({ error: "database not configured" }, { status: 503 });

  const parsed = postInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;

  const slug = await uniqueSlug(input.slug ?? slugify(input.title));
  const [row] = await db()
    .insert(posts)
    .values({
      ...input,
      slug,
      coverUrl: input.coverUrl ?? null,
      author: input.author ?? "StatLabs",
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning();

  revalidatePosts(row.slug);
  return Response.json({ post: row }, { status: 201 });
}
