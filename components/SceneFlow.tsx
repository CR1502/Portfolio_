"use client";
import { reducedMotion } from "@/lib/motion";
import { useEffect } from "react";
/** Native scrolling drives the image aperture, rather than delaying page navigation. */
export default function SceneFlow() {
  useEffect(() => {
    const frame = document.querySelector<HTMLElement>(".cinematic-frame");
    if (!frame) return;
    const reduced = reducedMotion();
    let raf = 0;
    const draw = () => {
      raf = 0;
      const r = frame.getBoundingClientRect(),
        progress = reduced.matches
          ? 1
          : Math.max(
              0,
              Math.min(1, (innerHeight - r.top) / (innerHeight * 0.8)),
            );
      frame.style.setProperty("--aperture", String(progress));
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request, { passive: true });
    reduced.addEventListener("change", request);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", request);
      removeEventListener("resize", request);
      reduced.removeEventListener("change", request);
    };
  }, []);
  return null;
}
