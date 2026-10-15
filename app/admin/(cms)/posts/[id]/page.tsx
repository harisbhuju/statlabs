import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { db, posts } from "@/lib/db";

export default async function EditPost({ params }: PageProps<"/admin/posts/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [post] = await db().select().from(posts).where(eq(posts.id, id));
  if (!post) notFound();
  return (
    <PostEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverUrl: post.coverUrl ?? "",
        tags: post.tags.join(", "),
        status: post.status as "draft" | "published",
        sources: post.sources,
      }}
    />
  );
}
