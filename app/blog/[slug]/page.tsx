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
    <article className="mx-auto max-w-[1100px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <header className="mx-auto max-w-4xl border-b border-rule pb-8 text-center">
        <Link href="/blog" className="eyebrow hover:!text-foreground">
          <span className="mr-3 text-accent">§</span>Analysis
        </Link>
        <h1 className="mt-6 font-display text-[42px] leading-[1.0] tracking-[-0.01em] sm:text-[64px]">{post.title}</h1>
        {post.excerpt && (
          <p className="mx-auto mt-6 max-w-2xl font-display text-[22px] italic leading-snug text-ink-2">
            {post.excerpt}
          </p>
        )}
        <div className="eyebrow mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="!text-foreground">By {post.author}</span>
          <span aria-hidden>/</span>
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>{dateFmt.format(post.publishedAt)}</time>
          )}
          <span aria-hidden>/</span>
          <span>{minutes} min read</span>
        </div>
      </header>

      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts
        <img src={post.coverUrl} alt="" className="mt-10 w-full border border-border" />
      )}

      <div className="mx-auto mt-12 max-w-[680px]">
        <Markdown dropCap>{post.content}</Markdown>

        {post.sources.length > 0 && (
          <section className="mt-16 border-t border-rule pt-6">
            <h2 className="eyebrow !text-foreground">Sources</h2>
            <ol className="mt-4">
              {post.sources.map((s, i) => (
                <li key={s.url} className="grid grid-cols-[2rem_1fr] border-b border-border py-2.5 text-[14px] last:border-0">
                  <span className="num font-mono text-[11px] text-muted pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline text-ink-2 hover:text-foreground">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="border border-border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider text-muted">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-16 border-t-2 border-rule pt-6">
          <Link href="/blog" className="text-[13px] link-underline">← More analysis</Link>
        </div>
      </div>
    </article>
  );
}
