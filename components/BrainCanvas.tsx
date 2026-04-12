'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BrainCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── WebGL availability check ──────────────────────────────────────────────
    try {
      const testCanvas = document.createElement('canvas');
      const ctx = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!ctx) return; // WebGL not supported — silently skip, brain-box stays hidden
    } catch {
      return;
    }

    // ── Scene setup ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    cam.position.set(0, 0, 5);

    const ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ren.setSize(container.clientWidth, container.clientHeight);
    ren.setPixelRatio(Math.min(devicePixelRatio, 2));
    ren.setClearColor(0, 0);
    container.appendChild(ren.domElement);

    // ── Theme-aware colors ────────────────────────────────────────────────────
    const getTheme = () =>
      document.documentElement.getAttribute('data-theme') || 'dark';

    const getColors = (th: string) => ({
      bc: th === 'dark' ? 0x58a6ff : 0x0969da,
      cc: th === 'dark' ? 0xf78166 : 0xcf222e,
      bo: th === 'dark' ? 0.05 : 0.12,
      wo: th === 'dark' ? 0.08 : 0.18,
      so: th === 'dark' ? 0.8 : 1,
    });

    let { bc, cc, bo, wo, so } = getColors(getTheme());

    // ── Brain geometry ────────────────────────────────────────────────────────
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    const brainMat = new THREE.MeshBasicMaterial({
      color: bc,
      transparent: true,
      opacity: bo,
      side: THREE.DoubleSide,
    });
    const lh = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 28, 28, 0, Math.PI),
      brainMat
    );
    lh.position.x = -0.06;
    brainGroup.add(lh);

    const rh = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 28, 28, Math.PI, Math.PI),
      brainMat
    );
    rh.position.x = 0.06;
    brainGroup.add(rh);

    const wireMat = new THREE.MeshBasicMaterial({
      color: bc,
      wireframe: true,
      transparent: true,
      opacity: wo,
    });
    brainGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 32), wireMat));

    const coreMat = new THREE.MeshBasicMaterial({
      color: cc,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), coreMat);
    brainGroup.add(core);

    // Path lines
    const pp: number[] = [];
    for (let i = 0; i < 80; i++) {
      for (let j = 0; j < 2; j++) {
        const t = Math.random() * Math.PI * 2;
        const p = Math.random() * Math.PI;
        const r = 0.25 + Math.random() * 0.95;
        pp.push(r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p));
      }
    }
    const pg2 = new THREE.BufferGeometry();
    pg2.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    const pathMat = new THREE.LineBasicMaterial({
      color: bc,
      transparent: true,
      opacity: 0.04,
    });
    brainGroup.add(new THREE.LineSegments(pg2, pathMat));

    // Synapses
    const sCount = 250;
    const synGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(sCount * 3);
    const synVel: { vx: number; vy: number; vz: number; speed: number }[] = [];
    for (let i = 0; i < sCount; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.random() * Math.PI;
      const r = 0.15 + Math.random() * 1.15;
      sp[i * 3] = r * Math.sin(p) * Math.cos(t);
      sp[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      sp[i * 3 + 2] = r * Math.cos(p);
      synVel.push({
        vx: (Math.random() - 0.5) * 0.006,
        vy: (Math.random() - 0.5) * 0.006,
        vz: (Math.random() - 0.5) * 0.006,
        speed: 0.4 + Math.random() * 1.6,
      });
    }
    synGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const synMat = new THREE.PointsMaterial({
      color: bc,
      size: 0.035,
      transparent: true,
      opacity: so,
    });
    brainGroup.add(new THREE.Points(synGeo, synMat));

    // Rings
    const ringMats: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < 3; i++) {
      const rm = new THREE.MeshBasicMaterial({
        color: bc,
        transparent: true,
        opacity: 0.04 - i * 0.008,
      });
      ringMats.push(rm);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45 + i * 0.15, 0.004, 8, 64), rm);
      ring.rotation.x = Math.PI / 2 + (i - 1) * 0.3;
      ring.rotation.z = i * 0.4;
      brainGroup.add(ring);
    }

    // ── Color update ──────────────────────────────────────────────────────────
    const updateBrainColors = (theme: string) => {
      const colors = getColors(theme);
      brainMat.color.setHex(colors.bc);
      brainMat.opacity = colors.bo;
      wireMat.color.setHex(colors.bc);
      wireMat.opacity = colors.wo;
      synMat.color.setHex(colors.bc);
      synMat.opacity = colors.so;
      coreMat.color.setHex(colors.cc);
      pathMat.color.setHex(colors.bc);
      pathMat.opacity = theme === 'dark' ? 0.04 : 0.08;
      ringMats.forEach((rm, idx) => {
        rm.color.setHex(colors.bc);
        rm.opacity = theme === 'dark' ? 0.04 - idx * 0.008 : 0.06 - idx * 0.01;
      });
    };

    const onThemeChange = (e: Event) => {
      const ce = e as CustomEvent<{ theme: string }>;
      updateBrainColors(ce.detail.theme);
    };
    window.addEventListener('themechange', onThemeChange);

    // ── Animation loop ────────────────────────────────────────────────────────
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      brainGroup.rotation.y = t * 0.12;
      brainGroup.rotation.x = Math.sin(t * 0.08) * 0.12;

      const sy = window.scrollY;
      const ms = Math.max(document.body.scrollHeight - innerHeight, 1);
      const lp = Math.min(sy / ms, 1);

      const pulseSpeed = 1.8 + lp * 3;
      const pScale = Math.sin(t * pulseSpeed) * 0.06 + 1 + lp * 0.08;
      core.scale.set(pScale, pScale, pScale);
      coreMat.opacity = 0.12 + Math.sin(t * pulseSpeed) * 0.1 + lp * 0.15;

      const pos = synGeo.attributes.position.array as Float32Array;
      const spdM = 1 + lp * 2;
      for (let i = 0; i < sCount; i++) {
        const x = i * 3;
        pos[x] += synVel[i].vx * synVel[i].speed * spdM;
        pos[x + 1] += synVel[i].vy * synVel[i].speed * spdM;
        pos[x + 2] += synVel[i].vz * synVel[i].speed * spdM;
        const d = Math.sqrt(pos[x] ** 2 + pos[x + 1] ** 2 + pos[x + 2] ** 2);
        if (d > 1.25 || d < 0.15) {
          synVel[i].vx *= -1;
          synVel[i].vy *= -1;
          synVel[i].vz *= -1;
        }
        if (Math.random() < 0.008 + lp * 0.01) {
          synVel[i].vx = (Math.random() - 0.5) * 0.009;
          synVel[i].vy = (Math.random() - 0.5) * 0.009;
          synVel[i].vz = (Math.random() - 0.5) * 0.009;
        }
      }
      synGeo.attributes.position.needsUpdate = true;
      brainGroup.position.y = -(sy / ms) * 2.5;
      brainGroup.rotation.z = (sy / ms) * Math.PI * 0.25;
      ren.render(scene, cam);
    };
    animate();

    // ── Resize handler ────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      cam.aspect = container.clientWidth / container.clientHeight;
      cam.updateProjectionMatrix();
      ren.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('themechange', onThemeChange);
      ren.dispose();
      if (container.contains(ren.domElement)) {
        container.removeChild(ren.domElement);
      }
    };
  }, []);

  return <div id="brain-box" ref={containerRef} />;
}
