import { eq } from "drizzle-orm";
import { canWritePosts } from "@/lib/auth";
import { db, posts } from "@/lib/db";
import { postPatch, uniqueSlug } from "@/lib/posts";
import { revalidatePosts } from "@/lib/revalidate";

async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return null;
  const [row] = await db().select().from(posts).where(eq(posts.id, id));
  return row ?? null;
}

export async function GET(req: Request, ctx: RouteContext<"/api/posts/[id]">) {
  if (!(await canWritePosts(req))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const post = await load(ctx.params);
  return post ? Response.json({ post }) : Response.json({ error: "not found" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/posts/[id]">) {
  if (!(await canWritePosts(req))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const post = await load(ctx.params);
  if (!post) return Response.json({ error: "not found" }, { status: 404 });

  const parsed = postPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;

  const slug = input.slug && input.slug !== post.slug ? await uniqueSlug(input.slug, post.id) : post.slug;
  const publishing = input.status === "published" && post.status !== "published";
  const [updated] = await db()
    .update(posts)
    .set({
      ...input,
      slug,
      publishedAt: publishing ? new Date() : input.status === "draft" ? null : post.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, post.id))
    .returning();

  revalidatePosts(post.slug, updated.slug);
  return Response.json({ post: updated });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/posts/[id]">) {
  if (!(await canWritePosts(req))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const post = await load(ctx.params);
  if (!post) return Response.json({ error: "not found" }, { status: 404 });
  await db().delete(posts).where(eq(posts.id, post.id));
  revalidatePosts(post.slug);
  return new Response(null, { status: 204 });
}
