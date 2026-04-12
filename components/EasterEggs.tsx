'use client';

import { useEffect, useState } from 'react';
import { projects } from '@/lib/data';

export default function EasterEggs() {
  const [konamiVisible, setKonamiVisible] = useState(false);
  const [logoToast, setLogoToast] = useState('');
  const [showLogoToast, setShowLogoToast] = useState(false);

  // Konami code listener
  useEffect(() => {
    const kCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    let kSeq: number[] = [];

    const onKeyDown = (e: KeyboardEvent) => {
      kSeq.push(e.keyCode);
      if (kSeq.length > kCode.length) kSeq.shift();
      if (kSeq.join(',') === kCode.join(',')) setKonamiVisible(true);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Logo click listener
  useEffect(() => {
    let lc = 0;
    const logoBtn = document.getElementById('logoBtn');
    if (!logoBtn) return;

    const onClick = () => {
      lc++;
      if (lc >= 7) {
        const msg = `🧠 This portfolio renders a 3D brain with 250 live synapses firing across ${projects.length} projects spanning 3 years of AI work`;
        setLogoToast(msg);
        setShowLogoToast(true);
        setTimeout(() => setShowLogoToast(false), 4000);
        lc = 0;
      }
    };

    logoBtn.addEventListener('click', onClick);
    return () => logoBtn.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <div
        className={`ee-overlay${konamiVisible ? ' show' : ''}`}
        onClick={() => setKonamiVisible(false)}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#58a6ff',
            marginBottom: '1rem',
          }}
        >
          ↑↑↓↓←→←→BA
        </div>
        <div style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '.5rem' }}>
          You found the Konami Code! 🎮
        </div>
        <div style={{ fontSize: '.75rem', color: '#8b949e' }}>
          Craig&apos;s first love was gaming before AI stole his heart
        </div>
        <div style={{ fontSize: '.6rem', color: '#484f58', marginTop: '2rem' }}>
          click anywhere to close
        </div>
      </div>

      <div className={`ee-toast${showLogoToast ? ' show' : ''}`} id="logoToast">
        {logoToast}
      </div>
    </>
  );
}
