import { ImageResponse } from "next/og";

export const alt = "StatLabs — The Superintelligence Index";
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
          background: "#f4f2ec",
          color: "#141413",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #141413", paddingBottom: 20 }}>
          <div style={{ fontSize: 44, display: "flex" }}>
            StatLabs<span style={{ color: "#d9442b" }}>.</span>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 4, color: "#7d7a71", alignSelf: "flex-end" }}>
            THE SUPERINTELLIGENCE INDEX
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1.0, letterSpacing: -1 }}>
            Measuring the world’s attention on superintelligence.
          </div>
        </div>
        <div style={{ fontSize: 22, letterSpacing: 3, color: "#45443f", borderTop: "1px solid #dcd8cd", paddingTop: 20 }}>
          SEARCH INTEREST · NEWS · X · DAILY ANALYSIS — STATLABS.SI
        </div>
      </div>
    ),
    size,
  );
}
