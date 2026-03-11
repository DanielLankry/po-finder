import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "פה קרוב — גלו עסקים קטנים וניידים קרוב אליכם";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          direction: "rtl",
        }}
      >
        {/* Logo / emoji cluster */}
        <div style={{ fontSize: 80, marginBottom: 32, display: "flex", gap: 16 }}>
          ☕ 🍽️ 🌸 💎
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#059669",
            marginBottom: 16,
            letterSpacing: "-2px",
          }}
        >
          פה קרוב
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "#374151",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          גלו עסקים ניידים קרוב אליכם — על המפה, בזמן אמת
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 24,
            color: "#6B7280",
          }}
        >
          pokarov.co.il
        </div>
      </div>
    ),
    { ...size }
  );
}
