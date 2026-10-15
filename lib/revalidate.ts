import { revalidatePath } from "next/cache";

/** Refresh every page that lists or renders posts. */
export function revalidatePosts(...slugs: string[]) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  for (const slug of slugs) revalidatePath(`/blog/${slug}`);
}
