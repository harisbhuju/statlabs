import type { Metadata } from "next";
import Link from "next/link";
import { countPublished, listPublished } from "@/lib/posts";

export const revalidate = 300;

const PER_PAGE = 12;

export const metadata: Metadata = {
  title: "Superintelligence Blog — Daily Analysis & News",
  description:
    "Daily analysis of the latest developments in artificial superintelligence (ASI), AGI research, AI safety and policy.",
  alternates: { canonical: "/blog" },
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function BlogIndex({ searchParams }: PageProps<"/blog">) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [posts, total] = await Promise.all([listPublished(PER_PAGE, (page - 1) * PER_PAGE), countPublished()]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Superintelligence Blog</h1>
      <p className="mt-2 text-muted">Daily analysis on the road to artificial superintelligence.</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted">No posts yet — the first daily analysis is on its way.</p>
      ) : (
        <ul className="mt-8 divide-y divide-border">
          {posts.map((p) => (
            <li key={p.id} className="py-6">
              <article>
                {p.publishedAt && (
                  <time dateTime={p.publishedAt.toISOString()} className="text-xs text-muted">
                    {dateFmt.format(p.publishedAt)}
                  </time>
                )}
                <h2 className="mt-1 text-xl font-medium leading-snug">
                  <Link href={`/blog/${p.slug}`} className="hover:text-accent">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted">{p.excerpt}</p>
                {p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex justify-between text-sm">
          {page > 1 ? <Link href={`/blog?page=${page - 1}`} className="text-accent">← Newer</Link> : <span />}
          {page < pages ? <Link href={`/blog?page=${page + 1}`} className="text-accent">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
