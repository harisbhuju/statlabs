import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/posts";
import { SITE } from "@/lib/site";

// Short cache so new daily articles reach Google quickly.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublished(5000);
  const latest = posts[0]?.publishedAt ?? undefined;
  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.url}/blog`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/what-is-superintelligence`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...posts.map((p) => ({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
