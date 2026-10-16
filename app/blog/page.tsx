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
    <div className="wrap max-w-4xl py-12 lg:py-16">
      <header>
        <div className="font-mono text-[11.5px] text-accent">◆ StatLabs analysis</div>
        <h1 className="mt-3 text-[40px] font-extrabold leading-[1] tracking-[-0.04em] sm:text-[56px]">The daily briefing</h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-2">
          Original, sourced analysis of what happened on the road to artificial superintelligence, published every
          morning.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="card mt-10 p-8 text-center text-muted">The first briefing is on its way.</p>
      ) : (
        <ol className="mt-10 grid gap-4">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className="card group block p-5 transition-colors hover:border-border-strong sm:p-6">
                <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11.5px] text-muted">
                  {p.publishedAt && <time dateTime={p.publishedAt.toISOString()}>{dateFmt.format(p.publishedAt)}</time>}
                  <span aria-hidden>·</span>
                  <span>{Math.max(1, Math.round(p.content.split(/\s+/).length / 230))} min read</span>
                </div>
                <h2 className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.02em] group-hover:text-accent sm:text-[26px]">
                  {p.title}
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{p.excerpt}</p>
                {p.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-ink-2">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-between text-[13px]">
          {page > 1 ? <Link href={`/blog?page=${page - 1}`} className="btn">← Newer</Link> : <span />}
          <span className="font-mono text-[12px] text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={`/blog?page=${page + 1}`} className="btn">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
