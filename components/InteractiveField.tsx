"use client";
import { useEffect, useRef } from "react";

/** A scroll-linked, layered contour field. No pointer input or scroll interception. */
export default function InteractiveField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(prefers-contrast: more)");
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (!canvas.current || contrast.matches) return;
      const surface = canvas.current,
        ctx = surface.getContext("2d");
      if (!ctx) return;
      let width = innerWidth,
        height = innerHeight,
        frame = 0;
      const draw = () => {
        frame = 0;
        if (document.hidden) return;
        const distance = reduced.matches ? 0 : scrollY;
        const phase = distance * 0.0007;
        document.documentElement.style.setProperty(
          "--scene-shift",
          `${Math.min(distance * 0.035, 70)}px`,
        );
        ctx.clearRect(0, 0, width, height);
        for (let layer = 0; layer < 3; layer++) {
          const offset = (distance * (0.08 + layer * 0.035)) % 100;
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          const colors = getComputedStyle(document.documentElement);
          const primary = colors.getPropertyValue("--cyan").trim(),
            secondary = colors.getPropertyValue("--amber").trim();
          gradient.addColorStop(0, layer === 1 ? secondary : primary);
          gradient.addColorStop(0.65, primary);
          gradient.addColorStop(1, secondary);
          ctx.globalAlpha = 0.13;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.75;
          for (let row = -4; row < Math.ceil(height / 100) + 5; row++) {
            ctx.beginPath();
            for (let x = -50; x <= width + 50; x += 16) {
              const wave =
                Math.sin((x / width) * 4.2 + phase + layer * 1.7) *
                  height *
                  0.12 +
                Math.cos((x / width) * 6 - phase * 0.6) * 45;
              const y = row * 100 + offset + wave + layer * 60 - 240;
              if (x === -50) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
      };
      const request = () => {
        if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
      };
      const resize = () => {
        width = innerWidth;
        height = innerHeight;
        const dpr = Math.min(devicePixelRatio, 1.5);
        surface.width = Math.round(width * dpr);
        surface.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        request();
      };
      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else request();
      };
      document.documentElement.classList.add("field-ready");
      resize();
      addEventListener("scroll", request, { passive: true });
      addEventListener("palettechange", request);
      addEventListener("resize", resize, { passive: true });
      document.addEventListener("visibilitychange", visibility);
      dispose = () => {
        cancelAnimationFrame(frame);
        removeEventListener("scroll", request);
        removeEventListener("palettechange", request);
        removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", visibility);
        document.documentElement.classList.remove("field-ready");
        document.documentElement.style.removeProperty("--scene-shift");
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
  }, []);
  return (
    <canvas ref={canvas} className="interactive-field" aria-hidden="true" />
  );
}
