import { listPublished } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const posts = await listPublished(50);
  const items = posts
    .map((p) => {
      const url = `${SITE.url}/blog/${p.slug}`;
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${p.publishedAt?.toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE.title)}</title><link>${SITE.url}</link><description>${esc(SITE.description)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
