import { ImageResponse } from "next/og";

export const alt = "StatLabs — What the world is saying about superintelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div
            style={{
              width: 48,
              height: 48,
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
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1, letterSpacing: -4 }}>
          <span>What the world is saying about</span>
          <span style={{ color: "#ee4b2b" }}>superintelligence</span>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#4b4a46" }}>
          Live news · Google search interest · social posts · daily briefing — statlabs.si
        </div>
      </div>
    ),
    size,
  );
}
