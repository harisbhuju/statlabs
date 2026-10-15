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

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "long" });

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

  return (
    <article className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Link href="/blog" className="text-sm text-muted hover:text-foreground">
        ← All posts
      </Link>
      <header className="mt-6 mb-8">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 text-sm text-muted">
          <span>{post.author}</span>
          {post.publishedAt && (
            <>
              ·<time dateTime={post.publishedAt.toISOString()}>{dateFmt.format(post.publishedAt)}</time>
            </>
          )}
        </div>
        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts
          <img src={post.coverUrl} alt="" className="mt-6 w-full rounded-2xl border border-border" />
        )}
      </header>

      <Markdown>{post.content}</Markdown>

      {post.sources.length > 0 && (
        <section className="mt-12 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium text-muted">Sources</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
