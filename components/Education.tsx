'use client';

import { useEffect, useRef } from 'react';
import { education } from '@/lib/data';

export default function Education() {
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
    <section id="education" ref={sectionRef}>
      <div className="rv">
        <div className="sec-label">Academic Background</div>
        <h2 className="sec-title">Education</h2>
      </div>
      <div className="edu-grid stg">
        {education.map((item, i) => (
          <div key={i} className="edu-card rvs">
            <div className="edu-deg">{item.deg}</div>
            <div className="edu-sch">{item.school}</div>
            <div className="edu-meta">
              {item.meta.map((m, j) => (
                <span key={j}>{m}</span>
              ))}
              <span className="gpa">GPA: {item.gpa}</span>
            </div>
            <div className="edu-courses">
              <strong>Coursework:</strong> {item.courses}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
