'use client';

import { useEffect, useRef, useState } from 'react';
import { skills } from '@/lib/data';

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const [skillHoverCount, setSkillHoverCount] = useState(0);
  const [toast, setToast] = useState('');
  const [showToast, setShowToast] = useState(false);

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

  const handleSkillHover = () => {
    setSkillHoverCount((prev) => {
      const next = prev + 1;
      if (next === 10) showSkillToast("You're thorough! 🔍");
      if (next === 20) showSkillToast('Okay, you\'re really checking everything 👀');
      if (next === 30) {
        showSkillToast('Hire me already! 🚀');
        return 0;
      }
      return next;
    });
  };

  const showSkillToast = (msg: string) => {
    setToast(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <section id="skills" ref={sectionRef}>
      <div className="rv">
        <div className="sec-label">Technical Arsenal</div>
        <h2 className="sec-title">Skills</h2>
      </div>
      <div className="sk-grid stg">
        {skills.map((group, i) => (
          <div key={i} className="sk-group rvs">
            <div className="sk-title">{group.t}</div>
            <div className="sk-items">
              {group.items.map((item, j) => (
                <span key={j} className="sk-tag" onMouseOver={handleSkillHover}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`ee-toast${showToast ? ' show' : ''}`}>{toast}</div>
    </section>
  );
}
