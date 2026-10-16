import { ImageResponse } from "next/og";
import { getPublishedBySlug } from "@/lib/posts";

export const alt = "StatLabs analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Share image for an article: StatLabs mark, the article title and its date. */
export default async function PostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPublishedBySlug((await params).slug);
  const title = post?.title ?? "StatLabs analysis";
  const fontSize = title.length > 70 ? 60 : title.length > 45 ? 70 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f5f5f3",
          color: "#111110",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "#111110",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#ee4b2b" }} />
          </div>
          StatLabs
          <span style={{ marginLeft: 12, fontSize: 24, fontWeight: 500, color: "#ee4b2b" }}>Analysis</span>
        </div>
        <div style={{ display: "flex", fontSize, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#4b4a46" }}>
          <span>{post?.publishedAt ? dateFmt.format(post.publishedAt) : ""}</span>
          <span>statlabs.si</span>
        </div>
      </div>
    ),
    size,
  );
}
