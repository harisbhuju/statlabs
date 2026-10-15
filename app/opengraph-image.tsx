import { ImageResponse } from "next/og";

export const alt = "StatLabs — Live superintelligence stats";
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
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #07080b 0%, #1a1440 100%)",
          color: "#e8eaf0",
        }}
      >
        <div style={{ fontSize: 32, color: "#8b7bff" }}>StatLabs</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>
          Tracking the road to superintelligence
        </div>
        <div style={{ fontSize: 30, marginTop: 24, color: "#8a90a2" }}>
          Live search trends · news · X conversation · daily analysis
        </div>
      </div>
    ),
    size,
  );
}
