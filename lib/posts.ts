import { and, desc, eq, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, hasDb, posts, type Post } from "@/lib/db";

export const postInput = z.object({
  title: z.string().min(3).max(300),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase-kebab-case")
    .max(200)
    .optional(),
  excerpt: z.string().max(500).default(""),
  content: z.string().default(""),
  coverUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  author: z.string().max(80).optional(),
  sources: z
    .array(z.object({ title: z.string(), url: z.string().url() }))
    .max(30)
    .default([]),
});
export const postPatch = postInput.partial();

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function uniqueSlug(base: string, excludeId?: number) {
  let slug = base || "post";
  for (let i = 2; ; i++) {
    const [hit] = await db().select({ id: posts.id }).from(posts).where(eq(posts.slug, slug));
    if (!hit || hit.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}

const published = () => and(eq(posts.status, "published"), lte(posts.publishedAt, new Date()));

/** Public reads swallow DB errors so pages still render (e.g. during build without a DB). */
export async function listPublished(limit = 20, offset = 0): Promise<Post[]> {
  if (!hasDb()) return [];
  try {
    return await db()
      .select()
      .from(posts)
      .where(published())
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);
  } catch (err) {
    console.error("listPublished failed", err);
    return [];
  }
}

export async function countPublished() {
  if (!hasDb()) return 0;
  try {
    const [r] = await db()
      .select({ n: sql<number>`count(*)::int` })
      .from(posts)
      .where(published());
    return r?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function getPublishedBySlug(slug: string): Promise<Post | null> {
  if (!hasDb()) return null;
  try {
    const [row] = await db()
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), published()));
    return row ?? null;
  } catch (err) {
    console.error("getPublishedBySlug failed", err);
    return null;
  }
}
