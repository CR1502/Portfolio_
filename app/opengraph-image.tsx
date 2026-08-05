import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Craig Roberts — AI Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#f3f5f8',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 9999, backgroundColor: '#1d4ed8' }} />
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 600 }}>
            AI Engineer
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 104, fontWeight: 700, color: '#14171f', letterSpacing: -2, lineHeight: 1 }}>
            Craig Roberts
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#4b5063', marginTop: 28, maxWidth: 860 }}>
            Multi-agent orchestration, RAG pipelines, and production-grade AI.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', width: 64, height: 3, backgroundColor: '#1d4ed8' }} />
          <div style={{ display: 'flex', fontSize: 20, color: '#7c8194' }}>
            MS in Artificial Intelligence — Northeastern University
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
