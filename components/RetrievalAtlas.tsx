"use client";
import { useEffect, useRef } from "react";

/** A projected retrieval landscape: relevant evidence rises from the corpus. */
const surface = (x: number, z: number) =>
  Math.exp(-((x - 1.2) ** 2 + (z - 0.6) ** 2) * 0.65) * 1.5 +
  Math.exp(-((x + 1.7) ** 2 + (z + 0.9) ** 2) * 0.9) * 0.95 +
  Math.exp(-((x - 0.2) ** 2 + (z + 1.7) ** 2)) * 0.8;
const project = (x: number, z: number) => [
  300 + x * 61 + z * 35,
  215 + z * 29 - x * 13 - surface(x, z) * 66,
];
const path = (points: number[][]) =>
  points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
export default function RetrievalAtlas() {
  const host = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      x = 0,
      y = 0;
    const move = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType === "touch") return;
      const r = element.getBoundingClientRect();
      x = (event.clientX - r.left) / r.width - 0.5;
      y = (event.clientY - r.top) / r.height - 0.5;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          element.style.setProperty("--atlas-x", `${-y * 12}deg`);
          element.style.setProperty("--atlas-y", `${x * 16}deg`);
        });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.style.removeProperty("--atlas-x");
      element.style.removeProperty("--atlas-y");
    };
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", reset);
    return () => {
      reset();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", reset);
    };
  }, []);
  const lines = Array.from({ length: 23 }, (_, i) => -3 + (i * 6) / 22);
  const samples = Array.from({ length: 61 }, (_, i) => -3 + i * 0.1);
  const selected = project(1.2, 0.6);
  return (
    <figure
      ref={host}
      className="retrieval-atlas"
      aria-labelledby="atlas-title"
    >
      <div className="atlas-caption">
        <span className="eyebrow" id="atlas-title">
          Context becomes evidence.
        </span>
      </div>
      <svg
        viewBox="0 -30 600 430"
        role="img"
        aria-label="An illustrated three-dimensional retrieval landscape, with a passage selected from the surrounding corpus."
      >
        <defs>
          <linearGradient id="atlas-line" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--cyan)" stopOpacity=".65" />
            <stop offset="1" stopColor="var(--cyan)" stopOpacity=".12" />
          </linearGradient>
          <radialGradient id="atlas-glow">
            <stop stopColor="var(--amber)" stopOpacity=".3" />
            <stop offset="1" stopColor="var(--amber)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx={selected[0]}
          cy={selected[1] + 25}
          rx="105"
          ry="65"
          fill="url(#atlas-glow)"
        />
        <g fill="none" stroke="url(#atlas-line)" strokeWidth=".8">
          {lines.map((n, i) => (
            <g key={i}>
              <path d={path(samples.map((x) => project(x, n)))} />
              <path d={path(samples.map((z) => project(n, z)))} />
            </g>
          ))}
        </g>
        <path
          d={path(
            samples
              .filter((x) => x >= -2.5 && x <= 1.2)
              .map((x) => project(x, 0.6)),
          )}
          fill="none"
          stroke="var(--amber)"
          strokeWidth="2"
        />
        <path
          d={`M${selected[0]} ${selected[1]}v-74`}
          stroke="var(--amber)"
          strokeDasharray="3 5"
        />
        <circle cx={selected[0]} cy={selected[1]} r="5" fill="var(--amber)" />
        <g
          transform={`translate(${selected[0] - 47} ${selected[1] - 119}) rotate(-7)`}
        >
          <rect
            x="0"
            y="5"
            width="98"
            height="50"
            rx="12"
            fill="var(--ink-900)"
          />
          <rect
            width="98"
            height="50"
            rx="12"
            fill="var(--ink-600)"
            stroke="var(--amber)"
            strokeOpacity=".65"
          />
          <path
            d="M17 16h60M17 25h45M17 34h55"
            stroke="var(--text)"
            strokeOpacity=".7"
            strokeWidth="2"
          />
          <path d="M66 34h11" stroke="var(--amber)" strokeWidth="3" />
        </g>
      </svg>
    </figure>
  );
}
