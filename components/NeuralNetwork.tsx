"use client";

import { useEffect, useRef, useState } from "react";
import { detectQuality } from "@/lib/quality";

const layers = [4, 6, 6, 3];
const diagram = layers.flatMap((count, layer) =>
  Array.from({ length: count }, (_, node) => ({
    x: 55 + layer * 125,
    y: 125 + (node - (count - 1) / 2) * 32,
    layer,
  })),
);

export default function NeuralNetwork() {
  const host = useRef<HTMLDivElement>(null);
  const trace = useRef<() => void>(() => {});
  const traceAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tracing, setTracing] = useState(false);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false,
      activated = false,
      timeout = 0;
    let cleanup = () => {};
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
    const initialize = async () => {
      const quality = detectQuality();
      if (quality.tier === "low" || cancelled) return;
      const THREE = await import("three");
      if (cancelled) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: quality.antialias,
          powerPreference: "low-power",
        });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(quality.dpr, 1.5));
      renderer.setClearAlpha(0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      mount.appendChild(renderer.domElement);
      mount.dataset.ready = "true";
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.2, 9);
      const group = new THREE.Group();
      scene.add(group);
      const css = getComputedStyle(document.documentElement);
      const cyan = new THREE.Color(css.getPropertyValue("--cyan").trim());
      const amber = new THREE.Color(css.getPropertyValue("--amber").trim());
      const light = new THREE.DirectionalLight(0xffffff, 2.4);
      light.position.set(-3, 4, 5);
      scene.add(light, new THREE.HemisphereLight(0xc8eaff, 0x111a2d, 2));
      const positions: InstanceType<typeof THREE.Vector3>[] = [];
      const ranges: number[][] = [];
      layers.forEach((count, layer) => {
        const indices: number[] = [];
        for (let node = 0; node < count; node++) {
          indices.push(positions.length);
          positions.push(
            new THREE.Vector3(
              (layer - 1.5) * 2.05,
              (node - (count - 1) / 2) * 0.65,
              layer === 1 || layer === 2 ? Math.sin(node * 1.7) * 0.58 : 0,
            ),
          );
        }
        ranges.push(indices);
      });
      const geometry = new THREE.SphereGeometry(0.115, 18, 12);
      const material = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.26,
      });
      const nodes = new THREE.InstancedMesh(
        geometry,
        material,
        positions.length,
      );
      const matrix = new THREE.Matrix4();
      positions.forEach((position, i) => {
        matrix.makeTranslation(position.x, position.y, position.z);
        nodes.setMatrixAt(i, matrix);
        nodes.setColorAt(i, i >= positions.length - 3 ? amber : cyan);
      });
      group.add(nodes);
      const edges: number[] = [];
      const routes: {
        from: InstanceType<typeof THREE.Vector3>;
        to: InstanceType<typeof THREE.Vector3>;
        layer: number;
      }[] = [];
      for (let layer = 0; layer < ranges.length - 1; layer++) {
        for (const a of ranges[layer])
          for (const b of ranges[layer + 1]) {
            edges.push(...positions[a].toArray(), ...positions[b].toArray());
            if ((a + b) % 3 === 0)
              routes.push({ from: positions[a], to: positions[b], layer });
          }
      }
      const edgeGeometry = new THREE.BufferGeometry();
      edgeGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(edges, 3),
      );
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: cyan,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
      const pulseGeometry = new THREE.SphereGeometry(0.055, 8, 6);
      const pulseMaterial = new THREE.MeshBasicMaterial({ color: amber });
      const pulses = new THREE.InstancedMesh(
        pulseGeometry,
        pulseMaterial,
        routes.length,
      );
      pulses.count = 0;
      group.add(pulses);
      let frame = 0,
        inView = false,
        lost = false,
        pointerX = 0,
        pointerY = 0,
        pulseStart = traceAt.current || -10000;
      const point = new THREE.Vector3();
      const render = (time: number) => {
        frame = 0;
        if (!inView || lost || document.hidden) return;
        const targetX = reduced.matches ? 0 : pointerY * 0.28;
        const targetY = reduced.matches ? -0.15 : -0.15 + pointerX * 0.4;
        group.rotation.x += (targetX - group.rotation.x) * 0.14;
        group.rotation.y += (targetY - group.rotation.y) * 0.14;
        let count = 0;
        const progress = (time - pulseStart) / 900;
        if (!reduced.matches && progress >= 0 && progress < 3)
          routes.forEach((route) => {
            const t = progress - route.layer;
            if (t < 0 || t > 1) return;
            point.lerpVectors(route.from, route.to, t);
            matrix.makeTranslation(point.x, point.y, point.z);
            pulses.setMatrixAt(count++, matrix);
          });
        pulses.count = count;
        pulses.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
        if (
          (!reduced.matches && progress >= 0 && progress < 3) ||
          Math.abs(group.rotation.x - targetX) > 0.001 ||
          Math.abs(group.rotation.y - targetY) > 0.001
        )
          frame = requestAnimationFrame(render);
      };
      const request = () => {
        if (!frame && !lost && inView && !document.hidden)
          frame = requestAnimationFrame(render);
      };
      trace.current = () => {
        pulseStart = performance.now();
        request();
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType === "touch" || reduced.matches) return;
        const r = mount.getBoundingClientRect();
        pointerX = Math.max(
          -0.5,
          Math.min(0.5, (event.clientX - r.left) / r.width - 0.5),
        );
        pointerY = Math.max(
          -0.5,
          Math.min(0.5, (event.clientY - r.top) / r.height - 0.5),
        );
        request();
      };
      const resize = () => {
        const w = Math.max(1, mount.clientWidth),
          h = Math.max(1, mount.clientHeight);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        request();
      };
      const io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (!inView) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else request();
      });
      io.observe(mount);
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else request();
      };
      const onLost = (event: Event) => {
        event.preventDefault();
        lost = true;
        cancelAnimationFrame(frame);
        frame = 0;
        delete mount.dataset.ready;
      };
      const onRestored = () => {
        lost = false;
        mount.dataset.ready = "true";
        resize();
      };
      renderer.domElement.addEventListener("webglcontextlost", onLost);
      renderer.domElement.addEventListener("webglcontextrestored", onRestored);
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("visibilitychange", visibility);
      reduced.addEventListener("change", request);
      resize();
      cleanup = () => {
        cancelAnimationFrame(frame);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", move);
        document.removeEventListener("visibilitychange", visibility);
        reduced.removeEventListener("change", request);
        renderer.domElement.removeEventListener("webglcontextlost", onLost);
        renderer.domElement.removeEventListener(
          "webglcontextrestored",
          onRestored,
        );
        [
          geometry,
          material,
          edgeGeometry,
          edgeMaterial,
          pulseGeometry,
          pulseMaterial,
        ].forEach((resource) => resource.dispose());
        renderer.dispose();
        renderer.domElement.remove();
        delete mount.dataset.ready;
        trace.current = () => {};
      };
    };
    const activate = () => {
      if (activated || reduced.matches) return;
      activated = true;
      events.forEach((event) => window.removeEventListener(event, activate));
      timeout = window.setTimeout(() => void initialize().catch(() => {}), 80);
    };
    events.forEach((event) =>
      window.addEventListener(event, activate, { passive: true }),
    );
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (timer.current) clearTimeout(timer.current);
      events.forEach((event) => window.removeEventListener(event, activate));
      cleanup();
    };
  }, []);

  return (
    <figure
      className={`neural-model${tracing ? " is-tracing" : ""}`}
      aria-labelledby="neural-title"
    >
      <figcaption>
        <span className="eyebrow" id="neural-title">
          A neural network, in motion
        </span>
        <span className="neural-note">
          Illustrative feed-forward architecture
        </span>
      </figcaption>
      <div className="neural-stage" ref={host}>
        <svg
          className="neural-fallback"
          viewBox="0 0 480 250"
          aria-hidden="true"
        >
          <g className="neural-connections">
            {diagram.flatMap((a, i) =>
              diagram.map((b, j) =>
                b.layer === a.layer + 1 ? (
                  <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                ) : null,
              ),
            )}
          </g>
          {diagram.map((node, i) => (
            <circle
              key={i}
              className={`neural-node layer-${node.layer}`}
              cx={node.x}
              cy={node.y}
              r="5"
            />
          ))}
        </svg>
      </div>
      <div className="neural-legend">
        <span>Input</span>
        <span>Hidden layers</span>
        <span>Output</span>
      </div>
      <button
        className="neural-trace neu"
        type="button"
        onClick={() => {
          traceAt.current = performance.now();
          trace.current();
          setTracing(false);
          requestAnimationFrame(() => setTracing(true));
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setTracing(false), 3000);
        }}
      >
        Trace a forward pass <span aria-hidden="true">↗</span>
      </button>
      <span className="sr-only" role="status">
        {tracing
          ? "A signal passes from the input, through the hidden layers, to the output. This is an illustration, not a trained model prediction."
          : ""}
      </span>
    </figure>
  );
}
