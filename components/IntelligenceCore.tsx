"use client";
import { useEffect, useRef } from "react";
type Point = [number, number, number];
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 43.7) * 43758.5453;
  return x - Math.floor(x);
};
const routes = Array.from({ length: 360 }, (_, i) => {
  const theta = hash(i + 1) * Math.PI * 2,
    phi = Math.acos(hash(i + 19) * 2 - 1),
    r = 0.55 + hash(i + 8) * 0.53;
  return Array.from({ length: 6 }, (_, j) => {
    const t = theta + j * 0.065;
    const p = phi + (j > 2 ? 0.08 : 0);
    const radius = r + (j === 3 ? 0.06 : 0);
    return [
      Math.round(radius * Math.sin(p) * Math.cos(t) * 18) / 18,
      Math.round(radius * Math.cos(p) * 18) / 18,
      Math.round(radius * Math.sin(p) * Math.sin(t) * 18) / 18,
    ] as Point;
  });
});
function project([x, y, z]: Point, rx = 0, ry = -0.25) {
  const a = x * Math.cos(ry) + z * Math.sin(ry),
    b = -x * Math.sin(ry) + z * Math.cos(ry),
    c = y * Math.cos(rx) - b * Math.sin(rx),
    d = y * Math.sin(rx) + b * Math.cos(rx),
    s = 175 / (1 + d * 0.18);
  return [300 + a * s, 205 + c * s, d];
}
function line(points: Point[], rx = 0, ry = -0.25) {
  return points
    .map((point, i) => {
      const [x, y] = project(point, rx, ry);
      return `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
export default function IntelligenceCore() {
  const host = useRef<HTMLElement>(null),
    svg = useRef<SVGSVGElement>(null),
    rotation = useRef([0, -0.25]);
  const draw = () => {
    svg.current
      ?.querySelectorAll<SVGPathElement>("[data-route]")
      .forEach((path, i) => {
        path.setAttribute(
          "d",
          line(routes[i], rotation.current[0], rotation.current[1]),
        );
        const depth = project(
          routes[i][0],
          ...(rotation.current as [number, number]),
        )[2];
        path.style.opacity = String(0.4 + (1 - depth) * 0.28);
      });
  };
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reduced.matches) return;
      const r = mount.getBoundingClientRect();
      rotation.current = [
        ((event.clientY - r.top - r.height / 2) / r.height) * 0.7,
        ((event.clientX - r.left - r.width / 2) / r.width) * 1.3 - 0.25,
      ];
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          draw();
        });
    };
    mount.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      mount.removeEventListener("pointermove", move);
    };
  }, []);
  return (
    <figure
      className="retrieval-atlas intelligence-core"
      ref={host}
      aria-labelledby="atlas-title"
    >
      <div className="atlas-caption">
        <span className="eyebrow" id="atlas-title">
          Context becomes evidence.
        </span>
      </div>
      <svg
        ref={svg}
        viewBox="0 0 600 420"
        role="img"
        aria-label="An original three-dimensional intelligence core made of angular circuit traces. Move the pointer to rotate it, or use the rotation buttons."
      >
        <defs>
          <radialGradient id="core-aura">
            <stop stopColor="var(--amber)" stopOpacity=".17" />
            <stop offset="1" stopColor="var(--amber)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="205" r="203" fill="url(#core-aura)" />
        <g fill="none" strokeLinecap="square" strokeLinejoin="miter">
          {routes.map((points, i) => (
            <path
              key={i}
              data-route={i}
              d={line(points)}
              stroke={i % 5 === 0 ? "var(--cyan)" : "var(--amber)"}
              strokeWidth={i % 9 === 0 ? 2 : 1}
              opacity={0.5 + hash(i) * 0.5}
            />
          ))}
        </g>
      </svg>
      <figcaption>
        <span>Move to explore</span>
        <div className="core-controls">
          <button
            type="button"
            aria-label="Rotate model left"
            onClick={() => {
              rotation.current[1] -= 0.3;
              draw();
            }}
          >
            ↶
          </button>
          <button
            type="button"
            aria-label="Rotate model right"
            onClick={() => {
              rotation.current[1] += 0.3;
              draw();
            }}
          >
            ↷
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
