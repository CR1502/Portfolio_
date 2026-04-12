'use client';

import { useEffect, useRef } from 'react';
import { tokenPool } from '@/lib/data';

interface Token {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  text: string;
  size: number;
  phase: number;
  layer: number;
}

interface DataStream {
  x: number;
  y: number;
  speed: number;
  baseX: number;
  size: number;
  phase: number;
}

interface InferenceToken {
  text: string;
  x: number;
  born: number;
  alpha: number;
}

export default function TransformerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    let nW = 0;
    let nH = 0;
    const mouse = { x: -999, y: -999 };
    let tokens: Token[] = [];
    let dataStreams: DataStream[] = [];
    let inferenceTokens: InferenceToken[] = [];
    let animId: number;

    const getLearnProgress = () => {
      const maxS = Math.max(document.body.scrollHeight - innerHeight, 1);
      return Math.min(window.scrollY / maxS, 1);
    };

    const initTransformer = () => {
      nW = cv.width = innerWidth;
      nH = cv.height = innerHeight;
      tokens = [];
      dataStreams = [];
      inferenceTokens = [];

      for (let i = 0; i < 40; i++) {
        tokens.push({
          x: Math.random() * nW,
          y: Math.random() * nH,
          homeX: nW * 0.1 + Math.random() * nW * 0.8,
          homeY: nH * 0.1 + Math.random() * nH * 0.8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          text: tokenPool[Math.floor(Math.random() * tokenPool.length)],
          size: Math.random() * 3 + 8,
          phase: Math.random() * Math.PI * 2,
          layer: Math.floor(Math.random() * 6),
        });
      }

      for (let i = 0; i < 10; i++) {
        const x = nW * 0.08 + Math.random() * nW * 0.84;
        for (let j = 0; j < 10; j++) {
          dataStreams.push({
            x: x + (Math.random() - 0.5) * 15,
            y: Math.random() * nH,
            speed: 0.2 + Math.random() * 0.6,
            baseX: x,
            size: 1 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const animTransformer = () => {
      cx.clearRect(0, 0, nW, nH);
      const t = Date.now() * 0.001;
      const cs = getComputedStyle(document.documentElement);
      const acRGB = cs.getPropertyValue('--cn').trim();
      const ac2RGB = cs.getPropertyValue('--cp').trim();
      const ac3RGB = '63,185,80';
      const lp = getLearnProgress();

      // Embedding streams
      dataStreams.forEach((d) => {
        d.y += d.speed * (1 + lp * 1.5);
        if (d.y > nH + 10) d.y = -10;
        const wobble = Math.sin(t * 0.5 + d.phase) * 15 * (1 - lp * 0.6);
        d.x = d.baseX + wobble;
        const pulse = Math.sin(t * 2 + d.phase) * 0.5 + 0.5;
        const a = (0.03 + pulse * 0.03) * (1 + lp * 0.8);

        cx.beginPath();
        cx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        cx.fillStyle = `rgba(${acRGB},${a})`;
        cx.fill();
        cx.beginPath();
        cx.moveTo(d.x, d.y);
        cx.lineTo(d.x, d.y - 6 - d.speed * 5);
        cx.strokeStyle = `rgba(${acRGB},${a * 0.5})`;
        cx.lineWidth = d.size * 0.5;
        cx.stroke();
      });

      // Token particles
      tokens.forEach((tk) => {
        const dx = mouse.x - tk.x;
        const dy = mouse.y - tk.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 250 && dist > 1) {
          const f = ((250 - dist) / 250) * 0.08;
          tk.vx += (dx / dist) * f;
          tk.vy += (dy / dist) * f;
        }

        const gridPull = lp * 0.015;
        tk.vx += (tk.homeX - tk.x) * gridPull;
        tk.vy += (tk.homeY - tk.y) * gridPull;
        tk.vx += (Math.random() - 0.5) * 0.03 * (1 - lp * 0.7);
        tk.vy += (Math.random() - 0.5) * 0.03 * (1 - lp * 0.7);
        tk.vx *= 0.98;
        tk.vy *= 0.98;
        tk.x += tk.vx;
        tk.y += tk.vy;

        if (tk.x < -120) tk.x = nW + 60;
        if (tk.x > nW + 120) tk.x = -60;
        if (tk.y < -60) tk.y = nH + 40;
        if (tk.y > nH + 60) tk.y = -40;

        const pulse = Math.sin(t * 1.5 + tk.phase) * 0.5 + 0.5;
        const baseAlpha = 0.06 + lp * 0.06;
        const a = baseAlpha + pulse * 0.04;

        cx.font = `${tk.size}px 'JetBrains Mono',monospace`;
        cx.fillStyle = `rgba(${acRGB},${a})`;
        cx.fillText(tk.text, tk.x, tk.y);
      });

      // Attention arcs
      const arcStrength = 0.02 + lp * 0.08;
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const a = tokens[i];
          const b = tokens[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const maxDist = 200 + lp * 100;
          if (d < maxDist && d > 30) {
            const layerBonus = a.layer === b.layer ? 2 : 1;
            const alpha = (1 - d / maxDist) * arcStrength * layerBonus;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2 - d * 0.12;
            cx.beginPath();
            cx.moveTo(a.x, a.y);
            cx.quadraticCurveTo(midX, midY, b.x, b.y);
            cx.strokeStyle = `rgba(${acRGB},${alpha})`;
            cx.lineWidth = 0.6;
            cx.stroke();
          }
        }
      }

      // Attention head pulses
      const burstCount = 3 + Math.floor(lp * 3);
      for (let b = 0; b < burstCount; b++) {
        const cx2 = nW * (0.15 + b * 0.18);
        const cy2 = nH * (0.25 + Math.sin(t * 0.15 + b * 1.8) * 0.2);
        const rays = 6 + Math.floor(lp * 6);
        const burstAlpha = Math.sin(t * 0.6 + b * 1.2) * 0.5 + 0.5;
        const size = 20 + lp * 30 + burstAlpha * 15;

        for (let r = 0; r < rays; r++) {
          const angle = (r / rays) * Math.PI * 2 + t * 0.2 * (1 - lp * 0.5);
          const len = 15 + burstAlpha * (25 + lp * 20);
          cx.beginPath();
          cx.moveTo(cx2, cy2);
          cx.lineTo(cx2 + Math.cos(angle) * len, cy2 + Math.sin(angle) * len);
          cx.strokeStyle = `rgba(${ac2RGB},${burstAlpha * (0.04 + lp * 0.06)})`;
          cx.lineWidth = 0.8 + lp * 0.5;
          cx.stroke();
        }

        const grd = cx.createRadialGradient(cx2, cy2, 0, cx2, cy2, size);
        grd.addColorStop(0, `rgba(${ac2RGB},${burstAlpha * (0.05 + lp * 0.08)})`);
        grd.addColorStop(1, `rgba(${ac2RGB},0)`);
        cx.beginPath();
        cx.arc(cx2, cy2, size, 0, Math.PI * 2);
        cx.fillStyle = grd;
        cx.fill();
      }

      // Learning progress bar
      if (lp > 0.02) {
        const barY = nH - 55;
        const barW = nW * 0.3;
        const barX = (nW - barW) / 2;

        cx.fillStyle = `rgba(${acRGB},.03)`;
        cx.fillRect(barX, barY, barW, 2);

        const fillColor =
          lp < 0.5 ? acRGB : lp < 0.85 ? '210,153,34' : ac3RGB;
        cx.fillStyle = `rgba(${fillColor},${0.08 + lp * 0.12})`;
        cx.fillRect(barX, barY, barW * lp, 2);

        const label =
          lp < 0.3
            ? 'training...'
            : lp < 0.6
            ? 'converging...'
            : lp < 0.85
            ? 'optimizing...'
            : 'trained ✓';
        cx.font = "8px 'JetBrains Mono',monospace";
        cx.fillStyle = `rgba(${fillColor},${0.06 + lp * 0.1})`;
        cx.textAlign = 'center';
        cx.fillText(label, nW / 2, barY - 6);

        const epoch = Math.floor(lp * 200);
        cx.fillText(
          `epoch ${epoch}/200  |  loss: ${(0.8 - lp * 0.77).toFixed(3)}  |  acc: ${(52 + lp * 44.1).toFixed(1)}%`,
          nW / 2,
          barY + 14
        );
        cx.textAlign = 'left';
      }

      // Inference stream
      if (Math.random() < 0.02 && inferenceTokens.length < 35) {
        const lastX = inferenceTokens.length
          ? inferenceTokens[inferenceTokens.length - 1].x +
            inferenceTokens[inferenceTokens.length - 1].text.length * 5.5 +
            10
          : nW * 0.05;
        if (lastX > nW * 0.92) {
          inferenceTokens = [];
        }
        inferenceTokens.push({
          text: tokenPool[Math.floor(Math.random() * tokenPool.length)],
          x: inferenceTokens.length ? lastX : nW * 0.05,
          born: t,
          alpha: 0,
        });
      }

      const streamY = nH - 25;
      inferenceTokens.forEach((tk, i) => {
        const age = t - tk.born;
        tk.alpha = Math.min(age * 2, 0.15 + lp * 0.05);
        if (age > 10) tk.alpha = Math.max(0, tk.alpha - (age - 10) * 0.04);
        cx.font = "8px 'JetBrains Mono',monospace";
        cx.fillStyle = `rgba(${acRGB},${tk.alpha})`;
        cx.fillText(tk.text, tk.x, streamY);
        if (i === inferenceTokens.length - 1 && Math.sin(t * 6) > 0) {
          const tw = cx.measureText(tk.text).width;
          cx.fillStyle = `rgba(${acRGB},${tk.alpha * 1.5})`;
          cx.fillRect(tk.x + tw + 2, streamY - 7, 1.5, 9);
        }
      });
      inferenceTokens = inferenceTokens.filter((tk) => t - tk.born < 14);

      animId = requestAnimationFrame(animTransformer);
    };

    initTransformer();
    animTransformer();

    const onResize = () => initTransformer();
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas id="neural-canvas" ref={canvasRef} />;
}
