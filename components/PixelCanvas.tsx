"use client";
/** Adapted from Componentry Pixel Canvas. MIT © 2026 Harsh Jadhav.
 * Source: https://componentry.dev/r/pixel-canvas.json
 * License: /vendor/componentry-LICENSE.txt */
import { useEffect, useRef } from "react";
const DEFAULT_COLORS = ["#e879f9", "#a78bfa", "#38bdf8", "#22d3ee"];
type Pixel = { x: number; y: number; intensity: number; phase: number };
export function PixelCanvas({
  gap = 7,
  speed = 0.035,
  colors = DEFAULT_COLORS,
}: {
  gap?: number;
  speed?: number;
  colors?: string[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
      contrast = matchMedia("(prefers-contrast: more)");
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (reduced.matches || contrast.matches) return;
      const ctx = surface.getContext("2d", { alpha: true });
      if (!ctx) return;
      const pixels = new Map<string, Pixel>(),
        cell = Math.max(4, gap),
        palette = colors.map((hex) =>
          [1, 3, 5].map((n) => parseInt(hex.slice(n, n + 2), 16)),
        );
      let frame = 0,
        last = 0,
        width = innerWidth,
        height = innerHeight,
        previous: { x: number; y: number } | null = null;
      const draw = (time: number) => {
        frame = 0;
        if (document.hidden) return;
        const delta = last ? Math.min(64, time - last) : 16;
        last = time;
        ctx.clearRect(0, 0, width, height);
        for (const [key, p] of pixels) {
          p.intensity *= Math.pow(1 - speed, delta / 16);
          p.phase = (p.phase + (0.001 * delta) / 16) % 1;
          if (p.intensity < 0.015) {
            pixels.delete(key);
            continue;
          }
          const t = ((p.phase + p.intensity) % 1) * (palette.length - 1),
            i = Math.floor(t),
            a = palette[i],
            b = palette[Math.min(i + 1, palette.length - 1)],
            f = t - i;
          ctx.fillStyle = `rgb(${a.map((v, n) => Math.round(v + (b[n] - v) * f)).join(",")})`;
          ctx.globalAlpha = p.intensity * 0.8;
          ctx.fillRect(p.x, p.y, cell - 1, cell - 1);
        }
        ctx.globalAlpha = 1;
        if (pixels.size) frame = requestAnimationFrame(draw);
        else last = 0;
      };
      const light = (x: number, y: number) => {
        const radius = 72;
        for (
          let cx = Math.floor((x - radius) / cell);
          cx <= Math.ceil((x + radius) / cell);
          cx++
        )
          for (
            let cy = Math.floor((y - radius) / cell);
            cy <= Math.ceil((y + radius) / cell);
            cy++
          ) {
            const distance = Math.hypot(
              cx * cell + cell / 2 - x,
              cy * cell + cell / 2 - y,
            );
            if (
              distance >= radius ||
              cx < 0 ||
              cy < 0 ||
              cx * cell > width ||
              cy * cell > height
            )
              continue;
            const key = `${cx}:${cy}`,
              intensity = Math.pow(1 - distance / radius, 1.5),
              p = pixels.get(key);
            if (p) p.intensity = Math.max(p.intensity, intensity);
            else if (pixels.size < 14000)
              pixels.set(key, {
                x: cx * cell,
                y: cy * cell,
                intensity,
                phase: ((cx * 37 + cy * 19) % 101) / 101,
              });
          }
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        const x = event.clientX,
          y = event.clientY;
        if (previous) {
          const distance = Math.hypot(x - previous.x, y - previous.y),
            steps = Math.min(20, Math.max(1, Math.ceil(distance / 20)));
          for (let i = 1; i <= steps; i++)
            light(
              previous.x + ((x - previous.x) * i) / steps,
              previous.y + ((y - previous.y) * i) / steps,
            );
        } else light(x, y);
        previous = { x, y };
        if (!frame) frame = requestAnimationFrame(draw);
      };
      const resize = () => {
        width = innerWidth;
        height = innerHeight;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        surface.width = Math.round(width * dpr);
        surface.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        pixels.clear();
        previous = null;
      };
      const leave = () => {
        previous = null;
      };
      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
          pixels.clear();
          ctx.clearRect(0, 0, width, height);
        }
        last = 0;
      };
      resize();
      addEventListener("pointermove", move, { passive: true });
      addEventListener("resize", resize, { passive: true });
      addEventListener("blur", leave);
      document.addEventListener("pointerleave", leave);
      document.addEventListener("visibilitychange", visibility);
      dispose = () => {
        cancelAnimationFrame(frame);
        pixels.clear();
        ctx.clearRect(0, 0, width, height);
        removeEventListener("pointermove", move);
        removeEventListener("resize", resize);
        removeEventListener("blur", leave);
        document.removeEventListener("pointerleave", leave);
        document.removeEventListener("visibilitychange", visibility);
      };
    };
    setup();
    reduced.addEventListener("change", setup);
    contrast.addEventListener("change", setup);
    return () => {
      dispose();
      reduced.removeEventListener("change", setup);
      contrast.removeEventListener("change", setup);
    };
  }, [gap, speed, colors]);
  return <canvas ref={canvas} className="pixel-canvas" aria-hidden="true" />;
}
export default PixelCanvas;
