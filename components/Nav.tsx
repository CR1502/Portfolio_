"use client";
/** A macOS-style magnetic dock, after the Componentry Magnetic Dock pattern: icons
 *  swell toward the cursor on a spring and settle back when it leaves. Vertical on
 *  the right edge on wide screens, along the bottom on phones. Icon paths: Lucide (ISC). */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type DockItem = { id: string; label: string; href: string; icon: ReactNode; external?: boolean };

const items: DockItem[] = [
  {
    id: "home",
    label: "Home",
    href: "#home",
    icon: (
      <>
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </>
    ),
  },
  {
    id: "experience",
    label: "Experience",
    href: "#experience",
    icon: (
      <>
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <rect width="20" height="14" x="2" y="6" rx="2" />
      </>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    href: "#projects",
    icon: <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
  },
  {
    id: "education",
    label: "Education",
    href: "#education",
    icon: (
      <>
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </>
    ),
  },
  {
    id: "skills",
    label: "Tools",
    href: "#skills",
    icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  },
  {
    id: "connect",
    label: "Say hello",
    href: "#connect",
    icon: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
  },
  {
    id: "resume",
    label: "Résumé",
    href: "/Craig_Roberts.pdf",
    external: true,
    icon: (
      <>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </>
    ),
  },
];

export default function Nav() {
  const [active, setActive] = useState("");
  const dock = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    for (const id of ["home", "about", "experience", "projects", "education", "skills", "connect"]) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  // Magnification: each icon's target scale falls off with its distance from the
  // cursor along the dock, and a damped spring carries it there.
  useEffect(() => {
    const host = dock.current;
    if (!host) return;
    const tiles = Array.from(host.querySelectorAll<HTMLElement>(".dock-item"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const scale = tiles.map(() => 1), velocity = tiles.map(() => 0);
    let target = tiles.map(() => 1), pointer: number | null = null, frame = 0;
    const vertical = () => getComputedStyle(host).flexDirection === "column";
    const step = () => {
      frame = 0;
      let moving = false;
      tiles.forEach((tile, i) => {
        velocity[i] = (velocity[i] + (target[i] - scale[i]) * 0.2) * 0.7;
        scale[i] += velocity[i];
        if (Math.abs(target[i] - scale[i]) < 0.001 && Math.abs(velocity[i]) < 0.001) {
          scale[i] = target[i];
          velocity[i] = 0;
        } else moving = true;
        tile.style.setProperty("--s", scale[i].toFixed(3));
      });
      if (moving) frame = requestAnimationFrame(step);
    };
    const aim = () => {
      const column = vertical();
      target = tiles.map((tile) => {
        if (pointer === null) return 1;
        const box = tile.getBoundingClientRect();
        const centre = column ? box.top + box.height / 2 : box.left + box.width / 2;
        const reach = Math.min(1, Math.abs(pointer - centre) / 130);
        return 1 + 0.55 * Math.cos((reach * Math.PI) / 2);
      });
      if (!frame) frame = requestAnimationFrame(step);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced.matches) return;
      pointer = vertical() ? event.clientY : event.clientX;
      aim();
    };
    const leave = () => {
      pointer = null;
      aim();
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    reduced.addEventListener("change", leave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      reduced.removeEventListener("change", leave);
    };
  }, []);

  return (
    <>
      <header className="nav-wrap">
        <div className="nav">
          <a className="brand" href="#home" aria-label="cr. — Craig Roberts, home">
            cr<span>.</span>
          </a>
        </div>
      </header>
      <nav className="dock" aria-label="Main navigation" ref={dock}>
        {items.map((item) => (
          <a
            key={item.id}
            className="dock-item"
            href={item.href}
            aria-label={item.external ? `${item.label} (opens in a new tab)` : item.label}
            aria-current={active === item.id ? "location" : undefined}
            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
            style={{ "--s": 1 } as CSSProperties}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {item.icon}
            </svg>
            <span className="dock-tip" aria-hidden="true">{item.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
