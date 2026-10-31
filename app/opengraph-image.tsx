import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Craig Roberts — AI Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#02070A",
        padding: "80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            width: 10,
            height: 10,
            borderRadius: 9999,
            backgroundColor: "#0297DE",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#0297DE",
            fontWeight: 600,
          }}
        >
          AI Engineer
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 700,
            color: "#edf3f6",
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          Craig Roberts
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#b9cbd6",
            marginTop: 28,
            maxWidth: 860,
          }}
        >
          Intelligence, engineered for the real world.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            width: 64,
            height: 3,
            backgroundColor: "#0297DE",
          }}
        />
        <div style={{ display: "flex", fontSize: 20, color: "#9bafbc" }}>
          MS in Artificial Intelligence — Northeastern University
        </div>
      </div>
    </div>,
    { ...size },
  );
}
