'use client';

import { useEffect, useRef } from 'react';
import { experience } from '@/lib/data';

export default function Experience() {
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
    <section id="experience" ref={sectionRef}>
      <div className="rv">
        <div className="sec-label">Career Timeline</div>
        <h2 className="sec-title">Experience</h2>
      </div>
      <div className="tl">
        {experience.map((item, i) => (
          <div key={i} className="tl-item rvl">
            <div className="tl-date">{item.date}</div>
            <div className="tl-co">{item.company}</div>
            <div className="tl-role">{item.role}</div>
            <div className="tl-loc">{item.loc}</div>
            <ul className="tl-det">
              {item.details.map((d, j) => (
                <li key={j}>{d}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
