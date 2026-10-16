import { desc } from "drizzle-orm";
import Link from "next/link";
import { db, posts } from "@/lib/db";

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminPosts() {
  const rows = await db()
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      author: posts.author,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .orderBy(desc(posts.updatedAt))
    .limit(200);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-4xl">Posts</h1>
        <Link href="/admin/posts/new" className="btn-primary">New post</Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Author</th>
                <th className="px-4 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-surface/60">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/posts/${p.id}`} className="hover:text-accent">{p.title}</Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.status === "published" ? "bg-live/10 text-live" : "bg-surface-2 text-muted"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{p.author}</td>
                  <td className="px-4 py-2.5 text-muted">{dateFmt.format(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
