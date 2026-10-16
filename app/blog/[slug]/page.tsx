import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { getPublishedBySlug, listPublished } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

// Posts are rendered on first request, then cached; publishing revalidates the path.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPublishedBySlug((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
    },
  };
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = await getPublishedBySlug((await params).slug);
  if (!post) notFound();

  const url = `${SITE.url}/blog/${post.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: { "@type": "Organization", name: post.author, url: `${SITE.url}/about` },
      publisher: {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        logo: { "@type": "ImageObject", url: `${SITE.url}/opengraph-image` },
      },
      mainEntityOfPage: url,
      image: post.coverUrl ?? `${url}/opengraph-image`,
      keywords: post.tags.join(", "),
      citation: post.sources.map((s) => s.url),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Analysis", item: `${SITE.url}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  const related = (await listPublished(4)).filter((p) => p.id !== post.id).slice(0, 3);
  const minutes = Math.max(1, Math.round(post.content.split(/\s+/).length / 230));

  return (
    <article className="wrap max-w-[760px] py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="font-mono text-[11.5px] text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/blog" className="text-accent hover:underline">◆ StatLabs analysis</Link>
      </nav>
      <h1 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] sm:text-[48px]">
        {post.title}
      </h1>
      {post.excerpt && <p className="mt-5 text-[19px] leading-relaxed text-ink-2">{post.excerpt}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border py-3.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-white" aria-hidden>
          SL
        </span>
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold">
            {post.author}{" "}
            <Link href="/about" className="font-normal text-muted underline decoration-border-strong underline-offset-2 hover:text-foreground">
              How we write
            </Link>
          </div>
          <div className="font-mono text-[11.5px] text-muted">
            {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{dateFmt.format(post.publishedAt)}</time>}
            {" · "}
            {minutes} min read
            {post.sources.length > 0 && ` · ${post.sources.length} sources`}
          </div>
        </div>
      </div>

      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts
        <img src={post.coverUrl} alt="" className="mt-8 w-full rounded-xl border border-border" />
      )}

      <div className="mt-8">
        <Markdown>{post.content}</Markdown>
      </div>

      {post.sources.length > 0 && (
        <section className="card mt-12 p-5">
          <h2 className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">Sources</h2>
          <ol className="mt-2">
            {post.sources.map((s, i) => (
              <li key={s.url} className="flex gap-3 border-t border-border py-2.5 text-[14px] first:border-0">
                <span className="num w-5 shrink-0 pt-0.5 font-mono text-[11px] text-muted">{i + 1}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline min-w-0 text-ink-2 hover:text-foreground">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {post.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-ink-2">
              {t}
            </span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="more-analysis">
          <h2 id="more-analysis" className="text-[18px] font-bold tracking-tight">More analysis</h2>
          <ul className="mt-3 grid gap-3">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/blog/${p.slug}`} className="card group block p-4 transition-colors hover:border-border-strong">
                  {p.publishedAt && (
                    <div className="font-mono text-[11.5px] text-muted">{dateFmt.format(p.publishedAt)}</div>
                  )}
                  <div className="mt-1 text-[16px] font-semibold leading-snug group-hover:text-accent">{p.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-2.5 border-t border-border pt-6">
        <Link href="/blog" className="btn">← All analysis</Link>
        <Link href="/what-is-superintelligence" className="btn">What is super intelligence?</Link>
        <Link href="/#feed" className="btn">Today&apos;s news feed</Link>
      </div>
    </article>
  );
}
