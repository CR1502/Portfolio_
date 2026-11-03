"use client";

import { useEffect, useState } from "react";
import { initMotionSync, isReducedMotion, setMotionOverride } from "@/lib/motion";

/**
 * Lets a visitor override the OS motion setting. The common case is a Windows
 * laptop with "Animation effects" off, which Chrome reports as reduced motion
 * and which otherwise freezes every scene. Defaults to honouring the OS; the
 * choice persists and a reload re-initialises every scene cleanly.
 */
export default function MotionToggle() {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(isReducedMotion());
    setMounted(true);
    return initMotionSync();
  }, []);

  // Render nothing until we know the real state, to avoid a hydration mismatch.
  if (!mounted) return null;

  return (
    <button
      type="button"
      className="neu motion-toggle"
      aria-pressed={!reduced}
      title={reduced ? "Turn animations on" : "Reduce animations"}
      onClick={() => setMotionOverride(reduced ? "on" : "off")}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {reduced ? (
          // "paused / enable": a play triangle hinting motion can resume
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M10 9l5 3-5 3V9z" />
          </>
        ) : (
          // "motion on": sparkles
          <>
            <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
            <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" />
          </>
        )}
      </svg>
      <span className="motion-toggle-label">
        {reduced ? "Animate" : "Motion"}
      </span>
    </button>
  );
}
