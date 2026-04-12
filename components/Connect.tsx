'use client';

import { useEffect, useRef } from 'react';

export default function Connect() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('v');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const el = sectionRef.current;
    if (el) {
      el.querySelectorAll('.rv,.rvl,.rvs').forEach((node) => observer.observe(node));
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="connect" ref={sectionRef}>
      <div className="rv">
        <div className="sec-label">Let&apos;s Talk</div>
        <h2 className="sec-title">Connect With Me</h2>
      </div>
      <div className="con-links rv">
        <a href="mailto:roberts.cr@northeastern.edu" className="con-link">
          <span className="ic">✉</span> roberts.cr@northeastern.edu
        </a>
        <a href="tel:+18573998600" className="con-link">
          <span className="ic">☏</span> +1 857-399-8600
        </a>
        <a href="https://linkedin.com/in/croberts02" target="_blank" rel="noreferrer" className="con-link">
          <span className="ic">in</span> LinkedIn
        </a>
        <a href="https://github.com/CR1502" target="_blank" rel="noreferrer" className="con-link">
          <span className="ic">⌘</span> GitHub
        </a>
      </div>
    </section>
  );
}
