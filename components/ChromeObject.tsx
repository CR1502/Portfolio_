"use client";

import { useEffect, useRef } from "react";
import { detectQuality } from "@/lib/quality";
import {
  cameraPose,
  parallax,
  setParallax,
  subscribeSceneMotion,
} from "@/lib/scene-motion";

/**
 * The signature element: one liquid-chrome object in the hero.
 *
 * The environment it reflects is generated at runtime from the page's own
 * palette tokens via PMREMGenerator, so there is no HDRI to download -- the
 * reflections and the CSS background are literally the same gradient, which is
 * what makes the object sit in the page rather than on it.
 *
 * Degrades by tier: high gets iridescence and per-frame rotation, mid drops
 * iridescence and halves the env map, low renders nothing at all and leaves the
 * CSS-only fallback visible.
 */
export default function ChromeObject() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    let activated = false;
    let idle = 0;
    const events = ["pointermove", "pointerdown", "wheel", "keydown"] as const;
    const activate = () => {
      if (activated || matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      activated = true;
      events.forEach((event) => window.removeEventListener(event, activate));
      idle = window.setTimeout(() => {
        const quality = detectQuality();
        if (quality.tier === "low" || cancelled || !host.current) return;
        void import("three")
          .then((THREE) => {
            const mount = host.current;
            if (cancelled || !mount) return;

            let renderer: InstanceType<typeof THREE.WebGLRenderer>;
            try {
              renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: quality.antialias,
                powerPreference: "default",
              });
            } catch {
              return; // CSS fallback stays visible.
            }

            const size = () => ({
              w: mount.clientWidth || 1,
              h: mount.clientHeight || 1,
            });
            let { w, h } = size();

            renderer.setPixelRatio(quality.dpr);
            renderer.setSize(w, h, false);
            renderer.setClearAlpha(0);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
            mount.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
            camera.position.set(0, 0, 5.2);

            const read = (name: string, fallback: string) =>
              getComputedStyle(document.documentElement)
                .getPropertyValue(name)
                .trim() || fallback;

            // --- environment, painted from the palette ---------------------
            const envCanvas = document.createElement("canvas");
            envCanvas.width = envCanvas.height = quality.envSize;
            const ctx = envCanvas.getContext("2d")!;
            const paintEnv = () => {
              const s = quality.envSize;
              const grad = ctx.createLinearGradient(0, 0, s, s);
              grad.addColorStop(0, read("--ink-700", "#111a2d"));
              grad.addColorStop(0.38, read("--cyan", "#48a9f8"));
              grad.addColorStop(0.62, read("--text", "#edf1f8"));
              grad.addColorStop(0.84, read("--amber", "#f2a45e"));
              grad.addColorStop(1, read("--ink-900", "#060a12"));
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, s, s);
              // A bright band gives the surface a specular streak to catch.
              const band = ctx.createLinearGradient(0, s * 0.18, 0, s * 0.42);
              band.addColorStop(0, "rgba(255,255,255,0)");
              band.addColorStop(0.5, "rgba(255,255,255,0.85)");
              band.addColorStop(1, "rgba(255,255,255,0)");
              ctx.fillStyle = band;
              ctx.fillRect(0, 0, s, s);
            };
            paintEnv();

            const envTexture = new THREE.CanvasTexture(envCanvas);
            envTexture.mapping = THREE.EquirectangularReflectionMapping;
            envTexture.colorSpace = THREE.SRGBColorSpace;
            const pmrem = new THREE.PMREMGenerator(renderer);
            let envRT = pmrem.fromEquirectangular(envTexture);
            scene.environment = envRT.texture;

            // --- the object -------------------------------------------------
            // A torus knot reads as "engineered" rather than decorative: it is a
            // closed path through itself, which is the shape of a retrieval loop.
            const geometry = new THREE.TorusKnotGeometry(
              1.08,
              0.34,
              quality.tier === "high" ? 220 : 128,
              quality.tier === "high" ? 32 : 20,
              2,
              3,
            );
            const material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(read("--text", "#edf1f8")),
              metalness: 1,
              roughness: 0.14,
              envMapIntensity: 1.5,
              clearcoat: 1,
              clearcoatRoughness: 0.08,
              ...(quality.tier === "high"
                ? {
                    iridescence: 0.7,
                    iridescenceIOR: 1.9,
                    iridescenceThicknessRange: [120, 520] as [number, number],
                  }
                : {}),
            });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            const key = new THREE.DirectionalLight(0xffffff, 1.4);
            key.position.set(-3, 3, 4); // matches --light-angle: 135deg
            scene.add(key, new THREE.AmbientLight(0x404a66, 0.6));

            // --- motion -----------------------------------------------------
            let frame = 0;
            let inView = false;
            let visible = false;
            let lost = false;
            const reduced = matchMedia("(prefers-reduced-motion: reduce)");

            const render = (time: number) => {
              frame = 0;
              if (!visible || lost) return;
              const t = time * 0.001;
              mesh.rotation.x = 0.28 + parallax.y * 0.3 + cameraPose.orbit;
              mesh.rotation.y =
                (quality.reflections && !reduced.matches ? t * 0.12 : 0.3) +
                parallax.x * 0.45 +
                cameraPose.dolly * 1.3;
              mesh.position.y =
                (quality.reflections && !reduced.matches
                  ? Math.sin(t * 0.55) * 0.05
                  : 0) -
                cameraPose.dolly * 0.5;
              camera.position.z = 5.2 - cameraPose.dolly * 0.7;
              camera.setFocalLength(35 + cameraPose.focus * 5);
              renderer.render(scene, camera);
              if (!reduced.matches && quality.reflections)
                frame = requestAnimationFrame(render);
            };
            const request = () => {
              if (!frame && visible && !lost)
                frame = requestAnimationFrame(render);
            };

            const onResize = () => {
              ({ w, h } = size());
              renderer.setSize(w, h, false);
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              request();
            };
            const onPointer = (e: PointerEvent) => {
              if (e.pointerType === "touch") return;
              setParallax(
                e.clientX / innerWidth - 0.5,
                e.clientY / innerHeight - 0.5,
              );
            };
            const onVisibility = () => {
              visible = inView && !document.hidden;
              if (!visible) {
                cancelAnimationFrame(frame);
                frame = 0;
              } else request();
            };
            // Pause when scrolled offscreen: no point shading pixels nobody sees.
            const io = new IntersectionObserver(([entry]) => {
              inView = entry.isIntersecting;
              visible = inView && !document.hidden;
              if (!visible) {
                cancelAnimationFrame(frame);
                frame = 0;
              } else request();
            });
            io.observe(mount);

            // Recover from a lost GPU context instead of leaving a dead canvas.
            const onLost = (e: Event) => {
              e.preventDefault();
              lost = true;
              cancelAnimationFrame(frame);
              frame = 0;
              mount.dataset.webglLost = "true";
            };
            const onRestored = () => {
              lost = false;
              delete mount.dataset.webglLost;
              paintEnv();
              envTexture.needsUpdate = true;
              envRT.dispose();
              envRT = pmrem.fromEquirectangular(envTexture);
              scene.environment = envRT.texture;
              request();
            };
            renderer.domElement.addEventListener("webglcontextlost", onLost);
            renderer.domElement.addEventListener(
              "webglcontextrestored",
              onRestored,
            );

            const resizeObserver = new ResizeObserver(onResize);
            resizeObserver.observe(mount);
            addEventListener("pointermove", onPointer, { passive: true });
            const unsubscribeMotion = subscribeSceneMotion(request);
            document.addEventListener("visibilitychange", onVisibility);
            reduced.addEventListener("change", request);

            request();

            cleanup = () => {
              cancelAnimationFrame(frame);
              io.disconnect();
              resizeObserver.disconnect();
              removeEventListener("pointermove", onPointer);
              unsubscribeMotion();
              document.removeEventListener("visibilitychange", onVisibility);
              reduced.removeEventListener("change", request);
              renderer.domElement.removeEventListener(
                "webglcontextlost",
                onLost,
              );
              renderer.domElement.removeEventListener(
                "webglcontextrestored",
                onRestored,
              );
              geometry.dispose();
              material.dispose();
              envTexture.dispose();
              envRT.dispose();
              pmrem.dispose();
              renderer.dispose();
              renderer.domElement.remove();
            };
          })
          .catch(() => {});
      }, 80);
    };
    events.forEach((event) =>
      window.addEventListener(event, activate, { passive: true }),
    );
    return () => {
      clearTimeout(idle);
      events.forEach((event) => window.removeEventListener(event, activate));
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div className="chrome-object" ref={host} aria-hidden="true" />;
}
