'use client';

import { useState } from 'react';

const links = [
  { label: 'Email',    text: 'roberts.cr@northeastern.edu', href: 'mailto:roberts.cr@northeastern.edu', sensitive: true },
  { label: 'Phone',    text: '+1 857-399-8600',             href: 'tel:+18573998600',                    sensitive: true },
  { label: 'LinkedIn', text: 'linkedin.com/in/croberts02',  href: 'https://linkedin.com/in/croberts02',  sensitive: false },
  { label: 'GitHub',   text: 'github.com/CR1502',           href: 'https://github.com/CR1502',           sensitive: false },
];

export default function Connect() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <section id="connect" className="ed-section">
      <div className="ed-section-header">
        <div className="ed-label">§ 05 · Connect</div>
      </div>
      {links.map(({ label, text, href, sensitive }) => {
        const show = !sensitive || revealed[label];
        return (
          <div key={label} className="ed-connect-row">
            <span className="ed-connect-label">{label}</span>
            {show ? (
              <a
                href={href}
                className="ed-connect-link"
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
              >
                {text}
              </a>
            ) : (
              <button
                type="button"
                className="ed-connect-reveal"
                aria-label={`Reveal ${label.toLowerCase()}`}
                onClick={() => setRevealed((r) => ({ ...r, [label]: true }))}
              >
                Click to reveal →
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}
