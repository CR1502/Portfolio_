"use client";

/** Wheel geometry and inertia adapted from Componentry Wheel Carousel.
 * MIT © 2026 Harsh Jadhav. Full notice: /vendor/componentry-LICENSE.txt */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { skills } from "@/lib/data";

const wrap = (value: number) => ((value % skills.length) + skills.length) % skills.length;
const offset = (index: number, rotation: number) => wrap(index - rotation + skills.length / 2) - skills.length / 2;

export default function Skills() {
  const wheel = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const velocity = useRef(0);
  const frame = useRef(0);
  const target = useRef<number | null>(null);
  const reduced = useRef(false);
  const gesture = useRef<{ id: number; y: number; rotation: number; last: number; time: number; moved: boolean } | null>(null);
  const suppressClick = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const selected = wrap(Math.round(rotation));

  const commit = (value: number) => { rotationRef.current = value; setRotation(value); };
  const animate = () => {
    if (frame.current) return;
    let previous = performance.now();
    const tick = (now: number) => {
      frame.current = 0;
      const dt = Math.min(2, Math.max(0.25, (now - previous) / 16.667));
      previous = now;
      if (gesture.current) return;
      if (reduced.current) {
        commit(Math.round(target.current ?? rotationRef.current));
        velocity.current = 0; target.current = null; return;
      }
      if (target.current === null && Math.abs(velocity.current) > 0.001) {
        commit(rotationRef.current + velocity.current * dt);
        velocity.current *= Math.pow(0.9, dt);
      } else {
        velocity.current = 0;
        const destination = target.current ?? Math.round(rotationRef.current);
        const delta = destination - rotationRef.current;
        if (Math.abs(delta) < 0.001) { commit(destination); target.current = null; return; }
        commit(rotationRef.current + delta * (1 - Math.pow(0.78, dt)));
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  const choose = (index: number) => {
    velocity.current = 0;
    target.current = rotationRef.current + offset(wrap(index), rotationRef.current);
    animate();
  };

  useEffect(() => {
    const host = wheel.current;
    if (!host) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = preference.matches;
    const motion = (event: MediaQueryListEvent) => {
      reduced.current = event.matches;
      if (event.matches) {
        cancelAnimationFrame(frame.current); frame.current = 0;
        commit(Math.round(target.current ?? rotationRef.current));
        velocity.current = 0; target.current = null;
      }
    };
    const scroll = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      cancelAnimationFrame(frame.current); frame.current = 0;
      target.current = null;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1);
      const delta = Math.max(-0.7, Math.min(0.7, pixels * 0.008));
      commit(rotationRef.current + delta);
      velocity.current = delta * 0.2;
      animate();
    };
    host.addEventListener("wheel", scroll, { passive: false });
    preference.addEventListener("change", motion);
    return () => {
      cancelAnimationFrame(frame.current);
      host.removeEventListener("wheel", scroll);
      preference.removeEventListener("change", motion);
    };
  }, []);

  return (
    <section id="skills" className="section skills-wheel-section panel" aria-labelledby="skills-title">
      <div className="section-heading">
        <div><p className="eyebrow">The toolkit</p><h2 id="skills-title">Tools I <em>work with.</em></h2></div>
        <p>Across models, data, and the systems that bring them together.</p>
      </div>
      <div className="skills-wheel-layout">
        <div className="skill-detail-stage">
          {skills.map((group, index) => (
            <section key={group.t} id={`skill-detail-${index}`} className="skill-detail" data-active={selected === index} aria-hidden={selected !== index} inert={selected !== index} aria-label={group.t}>
              <p className="eyebrow">{String(index + 1).padStart(2, "0")} / {String(skills.length).padStart(2, "0")}</p>
              <h3>{group.t}</h3>
              <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
        </div>
        <div className="skill-wheel-column">
          <p className="wheel-hint" id="skills-wheel-hint">Drag or scroll the wheel. Arrow keys work too.</p>
          <div ref={wheel} className="skill-wheel" data-dragging={dragging} role="listbox" aria-label="Skill categories" aria-describedby="skills-wheel-hint" aria-activedescendant={`skill-option-${selected}`} tabIndex={0}
            onKeyDown={event => {
              const direction = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : ["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 0;
              if (direction || event.key === "Home" || event.key === "End") {
                event.preventDefault(); choose(event.key === "Home" ? 0 : event.key === "End" ? skills.length - 1 : selected + direction);
              }
            }}
            onPointerDown={event => {
              if (!event.isPrimary || event.button !== 0) return;
              cancelAnimationFrame(frame.current); frame.current = 0; velocity.current = 0; target.current = null;
              suppressClick.current = 0;
              gesture.current = { id: event.pointerId, y: event.clientY, rotation: rotationRef.current, last: rotationRef.current, time: event.timeStamp, moved: false };
            }}
            onPointerMove={event => {
              const g = gesture.current;
              if (!g || g.id !== event.pointerId) return;
              const distance = event.clientY - g.y;
              if (!g.moved && Math.abs(distance) < 6) return;
              if (!g.moved) { g.moved = true; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }
              const next = g.rotation - distance * 0.02;
              velocity.current = Math.max(-0.35, Math.min(0.35, (next - g.last) * 16.667 / Math.max(1, event.timeStamp - g.time)));
              g.last = next; g.time = event.timeStamp;
              commit(next);
            }}
            onPointerUp={event => {
              const g = gesture.current;
              if (!g || g.id !== event.pointerId) return;
              gesture.current = null; setDragging(false);
              if (g.moved) suppressClick.current = performance.now() + 300;
              if (event.timeStamp - g.time > 100) velocity.current = 0;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              animate();
            }}
            onPointerCancel={() => { gesture.current = null; setDragging(false); velocity.current = 0; animate(); }}
          >
            <span className="wheel-marker" aria-hidden="true" />
            {skills.map((group, index) => {
              const distance = offset(index, rotation);
              const radians = distance * 14 * Math.PI / 180;
              const style = { transform: `translate(${-280 * (1 - Math.cos(radians))}px, ${280 * Math.sin(radians)}px) translateY(-50%) rotate(${distance * 14}deg) scale(${1 - Math.abs(distance) * 0.04})`, opacity: 1 - Math.abs(distance) * 0.08 } as CSSProperties;
              return <div key={group.t} id={`skill-option-${index}`} role="option" aria-selected={selected === index} aria-controls={`skill-detail-${index}`} className="wheel-option" style={style} onClick={() => { if (performance.now() >= suppressClick.current) choose(index); }}>{group.t}</div>;
            })}
          </div>
          <div className="skill-wheel-controls">
            <button type="button" aria-label="Previous skill category" onClick={() => choose(selected - 1)}>↑</button>
            <span aria-live="polite">{skills[selected].t}</span>
            <button type="button" aria-label="Next skill category" onClick={() => choose(selected + 1)}>↓</button>
          </div>
        </div>
      </div>
    </section>
  );
}
