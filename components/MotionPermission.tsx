"use client";

import { useEffect, useRef, useState } from "react";
import { setParallax } from "@/lib/scene-motion";

type OrientationPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<string>;
};
export default function MotionPermission() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const stop = useRef<() => void>(() => {});
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const update = () => {
      setSupported(
        coarse.matches &&
          !reduced.matches &&
          "DeviceOrientationEvent" in window,
      );
      if (reduced.matches || !coarse.matches) {
        stop.current();
        setEnabled(false);
      }
    };
    update();
    reduced.addEventListener("change", update);
    coarse.addEventListener("change", update);
    return () => {
      stop.current();
      reduced.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
    };
  }, []);
  const toggle = async () => {
    if (enabled) {
      stop.current();
      setEnabled(false);
      setMessage("Tilt is off.");
      return;
    }
    try {
      const orientation = DeviceOrientationEvent as OrientationPermission;
      if (
        orientation.requestPermission &&
        (await orientation.requestPermission()) !== "granted"
      ) {
        setMessage("Motion access wasn’t granted. Scrolling still works.");
        return;
      }
      let origin: { beta: number; gamma: number } | null = null;
      const move = (event: DeviceOrientationEvent) => {
        if (event.beta === null || event.gamma === null) return;
        if (!origin) {
          origin = { beta: event.beta, gamma: event.gamma };
          setMessage("Tilt gently to move the scene.");
        }
        setParallax(
          (event.gamma - origin.gamma) / 36,
          (event.beta - origin.beta) / 36,
        );
      };
      window.addEventListener("deviceorientation", move, { passive: true });
      const timeout = window.setTimeout(() => {
        if (!origin) {
          stop.current();
          setEnabled(false);
          setMessage("No motion sensor detected. Scrolling still works.");
        }
      }, 5000);
      stop.current = () => {
        clearTimeout(timeout);
        window.removeEventListener("deviceorientation", move);
        setParallax(0, 0);
      };
      setEnabled(true);
      setMessage("Waiting for your motion sensor…");
    } catch {
      setMessage("Tilt is unavailable here. Scrolling still works.");
    }
  };
  if (!supported) return null;
  return (
    <div className="motion-permission">
      <button
        className="neu"
        type="button"
        aria-pressed={enabled}
        onClick={toggle}
      >
        {enabled ? "Disable tilt" : "Enable tilt"}
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
