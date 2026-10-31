"use client";
import { useEffect, useRef, useState } from "react";
export default function SignalExperiment() {
  const [sent, setSent] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
      document.documentElement.removeAttribute("data-signal");
    },
    [],
  );
  return (
    <div className="signal-experiment">
      <button
        className="neu"
        onClick={() => {
          if (timeout.current) clearTimeout(timeout.current);
          setSent(true);
          document.documentElement.dataset.signal = "true";
          timeout.current = setTimeout(() => {
            setSent(false);
            document.documentElement.removeAttribute("data-signal");
          }, 2400);
        }}
      >
        {sent ? "Signal received ✓" : "Send a signal ↗"}
      </button>
      <span className="sr-only" role="status">
        {sent
          ? "Signal received. A small pulse travels through the background."
          : ""}
      </span>
    </div>
  );
}
