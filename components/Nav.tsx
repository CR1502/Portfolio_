'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
      <div className="logo" id="logoBtn" title="Try clicking me 7 times...">
        CR<span>.ai</span>
      </div>
      <ul className="nav-links">
        <li><a href="#experience">Experience</a></li>
        <li><a href="#education">Education</a></li>
        <li><a href="#projects">Projects</a></li>
        <li><a href="#skills">Skills</a></li>
        <li><a href="#connect">Connect</a></li>
      </ul>
      <div className="nav-r">
        <div className="status">
          <div className="status-dot"></div>
          OPEN TO WORK
        </div>
        <div className="tog" id="themeToggle" onClick={toggleTheme} title="Toggle theme">
          <span className="tog-sun">☀</span>
          <div className="tog-track">
            <div className="tog-thumb"></div>
          </div>
          <span className="tog-moon">☾</span>
        </div>
      </div>
    </nav>
  );
}
