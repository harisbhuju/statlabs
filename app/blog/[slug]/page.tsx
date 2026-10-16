import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { getPublishedBySlug } from "@/lib/posts";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
    keywords: post.tags.join(", "),
    ...(post.coverUrl ? { image: post.coverUrl } : {}),
  };

  const minutes = Math.max(1, Math.round(post.content.split(/\s+/).length / 230));

  return (
    <article className="wrap max-w-[760px] py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Link href="/blog" className="font-mono text-[11.5px] text-accent hover:underline">
        ◆ StatLabs analysis
      </Link>
      <h1 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] sm:text-[48px]">
        {post.title}
      </h1>
      {post.excerpt && <p className="mt-5 text-[19px] leading-relaxed text-ink-2">{post.excerpt}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border py-3.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-white" aria-hidden>
          SL
        </span>
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold">{post.author}</div>
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

      <div className="mt-12 flex flex-wrap gap-2.5 border-t border-border pt-6">
        <Link href="/blog" className="btn">← More analysis</Link>
        <Link href="/#feed" className="btn">Today&apos;s news feed</Link>
      </div>
    </article>
  );
}
