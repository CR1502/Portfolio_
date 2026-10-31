"use client";
import { useEffect, useState } from "react";
const palettes = [
  { id: "cobalt", name: "Cobalt / Tangerine" },
  { id: "acid", name: "Acid / Orchid" },
  { id: "cherry", name: "Cherry / Mint" },
];
export default function PalettePreview() {
  const [preview, setPreview] = useState(false),
    [active, setActive] = useState("cobalt");
  useEffect(() => {
    const params = new URLSearchParams(location.search),
      value = params.get("palette") || "cobalt";
    const chosen = palettes.some((p) => p.id === value) ? value : "cobalt";
    document.documentElement.dataset.palette = chosen;
    setActive(chosen);
    setPreview(params.has("preview"));
    window.dispatchEvent(new Event("palettechange"));
  }, []);
  if (!preview) return null;
  return (
    <aside className="palette-preview" aria-label="Color studies">
      <span>Color studies</span>
      <div>
        {palettes.map((p) => (
          <a
            href={`?palette=${p.id}&preview=1`}
            key={p.id}
            aria-current={active === p.id ? "true" : undefined}
          >
            {p.name}
          </a>
        ))}
      </div>
    </aside>
  );
}
