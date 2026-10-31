/**
 * Adaptive quality tiers. Decided once, from what the device actually reports,
 * and consumed by every 3D surface so they degrade together rather than each
 * guessing.
 */
export type Tier = "high" | "mid" | "low";

export interface Quality {
  tier: Tier;
  /** Capped device pixel ratio. ProMotion and 4K get sharpness; phones do not pay for it. */
  dpr: number;
  antialias: boolean;
  /** Environment map cube size for the chrome material. */
  envSize: number;
  /** Particle budget for the ambient field. */
  particles: number;
  /** Whether to run per-frame reflection updates at all. */
  reflections: boolean;
}

/**
 * Reads GPU renderer string, memory, and core count. Any WebGL failure falls
 * straight to "low", which the callers render as a static scene.
 */
let cached: Quality | undefined;

export function detectQuality(): Quality {
  const reduced =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced)
    return {
      tier: "low",
      dpr: 1,
      antialias: false,
      envSize: 0,
      particles: 0,
      reflections: false,
    };
  if (cached) return cached;

  // Treat a coarse pointer as a phone or tablet: a conservative default that
  // does not depend on sniffing the user agent.
  const coarse =
    typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const memory =
    (nav as { deviceMemory?: number } | undefined)?.deviceMemory ?? 4;
  const cores = nav?.hardwareConcurrency ?? 4;

  let gpuIsWeak = false;
  let webglOk = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      webglOk = true;
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : "";
      // Software rasterisers and the oldest mobile GPU families.
      gpuIsWeak =
        /swiftshader|llvmpipe|software|mali-4|adreno \(tm\) [12]/i.test(
          renderer,
        );
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    }
  } catch {
    webglOk = false;
  }

  const dprRaw = typeof devicePixelRatio === "number" ? devicePixelRatio : 1;

  if (!webglOk || reduced || gpuIsWeak || memory <= 2 || cores <= 2) {
    return (cached = {
      tier: "low",
      dpr: 1,
      antialias: false,
      envSize: 0,
      particles: 0,
      reflections: false,
    });
  }

  if (coarse || memory <= 4 || cores <= 4) {
    return (cached = {
      tier: "mid",
      dpr: Math.min(dprRaw, 2),
      antialias: false,
      envSize: 128,
      particles: 420,
      reflections: false,
    });
  }

  return (cached = {
    tier: "high",
    dpr: Math.min(dprRaw, 2),
    antialias: true,
    envSize: 256,
    particles: 1000,
    reflections: true,
  });
}
