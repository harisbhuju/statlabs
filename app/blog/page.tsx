import type { Metadata } from "next";
import Link from "next/link";
import { countPublished, listPublished } from "@/lib/posts";

export const revalidate = 300;

const PER_PAGE = 12;

export const metadata: Metadata = {
  title: "Superintelligence Analysis — Daily Briefings",
  description:
    "Daily analysis of the latest developments in artificial superintelligence (ASI), AGI research, AI safety and policy.",
  alternates: { canonical: "/blog" },
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function BlogIndex({ searchParams }: PageProps<"/blog">) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [posts, total] = await Promise.all([listPublished(PER_PAGE, (page - 1) * PER_PAGE), countPublished()]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="grid gap-4 border-b border-rule pb-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="eyebrow">
            <span className="mr-3 text-accent">§</span>Analysis
          </div>
          <h1 className="mt-4 font-display text-[52px] leading-[0.95] tracking-[-0.01em] sm:text-[72px]">
            The daily briefing
          </h1>
        </div>
        <p className="max-w-sm text-[15px] leading-relaxed text-ink-2">
          Original, sourced analysis of what moved on the road to artificial superintelligence — every day.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="py-16 font-display text-2xl italic text-muted">The first briefing is on its way.</p>
      ) : (
        <ol>
          {posts.map((p) => (
            <li key={p.id} className="border-b border-border">
              <Link href={`/blog/${p.slug}`} className="group grid gap-2 py-8 sm:grid-cols-[9rem_1fr] sm:gap-8">
                <div className="eyebrow pt-2">
                  {p.publishedAt && <time dateTime={p.publishedAt.toISOString()}>{dateFmt.format(p.publishedAt)}</time>}
                </div>
                <article>
                  <h2 className="font-display text-[30px] leading-[1.05] group-hover:text-accent sm:text-[36px]">
                    {p.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{p.excerpt}</p>
                  {p.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-wider text-muted">
                      {p.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                </article>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {pages > 1 && (
        <nav className="flex justify-between pt-8 text-[13px]">
          {page > 1 ? <Link href={`/blog?page=${page - 1}`} className="link-underline">← Newer</Link> : <span />}
          <span className="eyebrow">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={`/blog?page=${page + 1}`} className="link-underline">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
