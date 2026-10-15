import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublished(5000);
  return [
    { url: SITE.url, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.url}/blog`, changeFrequency: "daily", priority: 0.9 },
    ...posts.map((p) => ({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
