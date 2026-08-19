import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#132b32",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <div
          style={{
            width: 180,
            height: 180,
            border: "3px solid #b89555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            color: "#d1b579",
          }}
        >
          AM
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 56, fontWeight: 700 }}>
            Abdulrahman Almawdah
          </span>
          <span style={{ fontSize: 28, color: "#c7cdc9", marginTop: 18 }}>
            Lawyer &amp; Legal Consultant · Bahrain
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
