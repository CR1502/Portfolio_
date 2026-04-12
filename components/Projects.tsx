'use client';

import { useEffect, useRef } from 'react';
import { projects } from '@/lib/data';

export default function Projects() {
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
    <section id="projects" ref={sectionRef}>
      <div className="rv">
        <div className="sec-label">Selected Work</div>
        <h2 className="sec-title">Projects</h2>
      </div>
      <div className="proj-grid stg">
        {projects.map((p, i) => (
          <div key={i} className="proj-card rvs">
            <div className="proj-num">{p.num}</div>
            <div className="proj-name">{p.name}</div>
            <div className="proj-sub">{p.sub}</div>
            <div className="proj-date">{p.date}</div>
            <p className="proj-desc">{p.desc}</p>
            <div className="proj-tags">
              {p.tags.map((tag, j) => (
                <span key={j}>{tag}</span>
              ))}
            </div>
            <div className="proj-links">
              <a href={p.gh} className="proj-link" target="_blank" rel="noreferrer">
                GitHub →
              </a>
              {p.demo && (
                <a href={p.demo} className="proj-link demo" target="_blank" rel="noreferrer">
                  Live Demo ⬈
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
