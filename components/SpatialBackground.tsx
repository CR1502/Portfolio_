"use client";

import { useEffect, useRef } from "react";
import { detectQuality } from "@/lib/quality";
import { cameraPose, parallax, subscribeSceneMotion } from "@/lib/scene-motion";

/** The shared camera passes quiet node fields; CSS owns the light and grid. */
export default function SpatialBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    let idle = 0;
    const start = async () => {
      const quality = detectQuality();
      if (quality.tier === "low" || cancelled || !canvas.current) return;
      const THREE = await import("three");
      if (cancelled || !canvas.current) return;
      const surface = canvas.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: surface,
          alpha: true,
          antialias: quality.antialias,
          powerPreference: "low-power",
        });
      } catch {
        surface.dataset.webglLost = "true";
        return;
      }
      renderer.setPixelRatio(quality.dpr);
      renderer.setClearColor(0, 0);
      surface.dataset.quality = quality.tier;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        55,
        innerWidth / innerHeight,
        1,
        2600,
      );
      camera.position.z = 500;
      const resources: { dispose: () => void }[] = [];
      const groups: InstanceType<typeof THREE.Group>[] = [];
      const lines: InstanceType<typeof THREE.LineBasicMaterial>[] = [];
      const dots: InstanceType<typeof THREE.PointsMaterial>[] = [];
      let seed = 2718;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      const clusters = quality.tier === "high" ? 4 : 2;
      const count = Math.min(
        75,
        Math.max(24, Math.floor(quality.particles / 10)),
      );
      for (let cluster = 0; cluster < clusters; cluster++) {
        const group = new THREE.Group();
        group.position.set(
          cluster % 2 === 0 ? 300 : -340,
          cluster % 2 === 0 ? 0 : -80,
          -cluster * 850 - 100,
        );
        const nodes: number[] = [];
        for (let i = 0; i < count; i++) {
          const theta = random() * Math.PI * 2,
            phi = Math.acos(2 * random() - 1),
            radius = 120 + random() * 110;
          nodes.push(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi),
          );
        }
        const edges: number[] = [];
        for (let i = 0; i < count; i++) {
          let connected = 0;
          for (let j = i + 1; j < count && connected < 3; j++) {
            if (
              Math.hypot(
                nodes[i * 3] - nodes[j * 3],
                nodes[i * 3 + 1] - nodes[j * 3 + 1],
                nodes[i * 3 + 2] - nodes[j * 3 + 2],
              ) < 120
            ) {
              edges.push(
                ...nodes.slice(i * 3, i * 3 + 3),
                ...nodes.slice(j * 3, j * 3 + 3),
              );
              connected++;
            }
          }
        }
        const nodeGeometry = new THREE.BufferGeometry();
        nodeGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(nodes, 3),
        );
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(edges, 3),
        );
        const dotMaterial = new THREE.PointsMaterial({
          size: 2.5,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        });
        const edgeMaterial = new THREE.LineBasicMaterial({
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
        });
        group.add(
          new THREE.Points(nodeGeometry, dotMaterial),
          new THREE.LineSegments(edgeGeometry, edgeMaterial),
        );
        scene.add(group);
        groups.push(group);
        lines.push(edgeMaterial);
        dots.push(dotMaterial);
        resources.push(nodeGeometry, edgeGeometry, dotMaterial, edgeMaterial);
      }
      let frame = 0,
        lost = false,
        visible = !document.hidden;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      const render = () => {
        frame = 0;
        if (lost || !visible) return;
        const t = reduced.matches ? 0 : cameraPose.dolly;
        camera.position.set(
          reduced.matches
            ? 0
            : parallax.x * 18 + Math.sin(cameraPose.orbit) * 42,
          reduced.matches ? 0 : -parallax.y * 12,
          500 - t * 1850,
        );
        camera.setFocalLength(
          35 + (reduced.matches ? 0 : cameraPose.focus * 6),
        );
        camera.lookAt(
          camera.position.x * 0.3,
          camera.position.y * 0.3,
          camera.position.z - 600,
        );
        groups.forEach((group, i) => {
          group.rotation.y = t * 0.8 + i * 0.35;
          group.rotation.z = i * 0.15;
          const depth = Math.abs(group.position.z - camera.position.z);
          dots[i].opacity = 0.3 + 0.2 * Math.max(0, 1 - depth / 1000);
        });
        renderer.render(scene, camera);
      };
      const request = () => {
        if (!frame && visible && !lost) frame = requestAnimationFrame(render);
      };
      const resize = () => {
        renderer.setSize(innerWidth, innerHeight);
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        request();
      };
      const palette = () => {
        const s = getComputedStyle(document.documentElement);
        lines.forEach((m, i) =>
          m.color.set(s.getPropertyValue(i % 2 ? "--amber" : "--cyan").trim()),
        );
        dots.forEach((m, i) => m.color.copy(lines[i].color));
        request();
      };
      const visibility = () => {
        visible = !document.hidden;
        if (!visible) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else request();
      };
      const onLost = (event: Event) => {
        event.preventDefault();
        lost = true;
        cancelAnimationFrame(frame);
        frame = 0;
        surface.dataset.webglLost = "true";
      };
      const onRestored = () => {
        lost = false;
        delete surface.dataset.webglLost;
        palette();
        resize();
      };
      const unsubscribe = subscribeSceneMotion(request);
      const observer = new MutationObserver(palette);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-palette"],
      });
      surface.addEventListener("webglcontextlost", onLost);
      surface.addEventListener("webglcontextrestored", onRestored);
      addEventListener("resize", resize, { passive: true });
      document.addEventListener("visibilitychange", visibility);
      reduced.addEventListener("change", request);
      resize();
      palette();
      dispose = () => {
        cancelAnimationFrame(frame);
        unsubscribe();
        observer.disconnect();
        surface.removeEventListener("webglcontextlost", onLost);
        surface.removeEventListener("webglcontextrestored", onRestored);
        removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", visibility);
        reduced.removeEventListener("change", request);
        resources.forEach((r) => r.dispose());
        renderer.dispose();
      };
    };
    // No GPU probe or renderer initialization before the visitor engages.
    let activated = false;
    const events = ["pointermove", "pointerdown", "wheel", "keydown"] as const;
    const activate = () => {
      if (activated || matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      activated = true;
      events.forEach((event) => window.removeEventListener(event, activate));
      idle = window.setTimeout(() => void start().catch(() => {}), 250);
    };
    events.forEach((event) =>
      window.addEventListener(event, activate, { passive: true }),
    );
    return () => {
      cancelled = true;
      clearTimeout(idle);
      events.forEach((event) => window.removeEventListener(event, activate));
      dispose();
    };
  }, []);
  return (
    <canvas className="spatial-background" ref={canvas} aria-hidden="true" />
  );
}
