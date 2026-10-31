"use client";

import { useEffect, useRef } from "react";

const vertex = `
attribute vec3 a_position;
attribute float a_seed;
attribute float a_aux;
uniform float u_time;
uniform float u_aspect;
uniform float u_size;
uniform mediump float u_lines;
uniform vec4 u_ripple;
varying float v_light;
varying float v_tone;
varying float v_aux;
varying float v_flash;
varying float v_head;
void main() {
  float ripple = 0.0;
  if (u_ripple.w >= 0.0) {
    float ring = distance(a_position, u_ripple.xyz) - u_ripple.w * 0.95;
    ripple = exp(-ring * ring * 150.0) * (1.0 - u_ripple.w);
  }
  vec3 p = a_position * (1.0 + sin(u_time * 0.7) * 0.018);
  float turn = 1.25 + u_time * 0.1;
  p.xz = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * p.xz;
  float tilt = 0.3 + sin(u_time * 0.2) * 0.05;
  p.yz = mat2(cos(tilt), sin(tilt), -sin(tilt), cos(tilt)) * p.yz;
  p.y += sin(u_time * 0.32) * 0.03 + 0.1;
  float perspective = 4.0 / (4.0 - p.z);
  float scale = 0.86 * min(1.0, u_aspect / 1.15);
  gl_Position = vec4(p.x * perspective * scale / u_aspect, p.y * perspective * scale, -p.z * 0.2, 1.0);
  float front = smoothstep(-1.0, 1.0, p.z);
  float cycle = fract(u_time * 0.08 + a_seed * 23.17);
  float spark = step(0.9, fract(a_seed * 7.31)) * exp(-pow((cycle - 0.5) * 70.0, 2.0));
  v_flash = max(spark, ripple);
  v_tone = clamp(0.45 + a_position.y * 0.75 + (a_seed - 0.5) * 0.4, 0.0, 1.0);
  v_aux = a_aux;
  v_head = fract(u_time * 0.16 + a_seed * 9.7) * 6.0 - 1.0;
  if (u_lines > 0.5) {
    v_light = mix(0.25, 1.0, front) + ripple;
  } else {
    v_light = a_aux * mix(0.22, 1.0, front) + v_flash * 1.2;
    gl_PointSize = (1.4 + a_seed * 1.3 + v_flash * 2.6) * u_size * perspective;
  }
}
`;
const fragment = `
precision mediump float;
uniform float u_lines;
varying float v_light;
varying float v_tone;
varying float v_aux;
varying float v_flash;
varying float v_head;
void main() {
  vec3 color = mix(vec3(0.14, 0.86, 0.62), vec3(0.52, 0.9, 1.0), v_tone);
  vec3 flash = vec3(0.88, 1.0, 0.98);
  float alpha;
  if (u_lines > 0.5) {
    float pulse = exp(-pow((v_aux - v_head) * 10.0, 2.0));
    color = mix(color, flash, max(pulse, v_flash));
    alpha = min(1.0, 0.035 * v_light + pulse * 0.6);
  } else {
    vec2 q = gl_PointCoord - 0.5;
    alpha = min(1.0, exp(-dot(q, q) * 12.0) * v_light * 0.62);
    color = mix(color, flash, v_flash);
  }
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
/** Deterministic mulberry32, so the brain is identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Lobe = readonly [number, number, number, number, number, number];
const cerebellum: readonly Lobe[] = [
  [0.2, -0.4, -0.56, 0.29, 0.2, 0.29],
  [-0.2, -0.4, -0.56, 0.29, 0.2, 0.29],
];
const within = (l: Lobe, x: number, y: number, z: number) => {
  const px = (x - l[0]) / l[3], py = (y - l[1]) / l[4], pz = (z - l[2]) / l[5];
  return px * px + py * py + pz * pz < 1;
};
const bump = (dx: number, dy: number, dz: number, ax: number, ay: number, az: number, width: number, amount: number) =>
  amount * Math.exp((dx * ax + dy * ay + dz * az - 1) / width);
/** Radius of one hemisphere along a unit direction (x lateral, y up, z frontal): a long
 *  ellipsoid with a temporal lobe bulging down and forward, a raised crown, a flat underside. */
function hemisphereRadius(dx: number, dy: number, dz: number) {
  const ex = dx / 0.42, ey = dy / 0.6, ez = dz / 0.96;
  return (1 + bump(dx, dy, dz, 0.68, -0.68, 0.33, 0.07, 0.2) + bump(dx, dy, dz, 0, 0.94, -0.33, 0.18, 0.08)
    - bump(dx, dy, dz, 0, -0.98, -0.2, 0.12, 0.2)) / Math.sqrt(ex * ex + ey * ey + ez * ez);
}

/** Interleaved [x, y, z, seed, aux]: aux is brightness for points, position along the axon for lines. */
function geometry() {
  const random = rng(7);
  // The zero set of a random wave field meanders like the sulci between gyri.
  const waves: number[] = [];
  for (let i = 0; i < 8; i++) {
    const u = random() * 2 - 1, a = random() * Math.PI * 2, r = Math.sqrt(1 - u * u), k = 10 + random() * 4;
    waves.push(r * Math.cos(a) * k, u * k, r * Math.sin(a) * k, random() * Math.PI * 2);
  }
  const fold = (x: number, y: number, z: number) => {
    let sum = 0;
    for (let i = 0; i < 32; i += 4) sum += Math.sin(waves[i] * x + waves[i + 1] * y + waves[i + 2] * z + waves[i + 3]);
    return sum / 2;
  };
  const points: number[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 40000; i++) {
      const u = random() * 2 - 1, a = random() * Math.PI * 2, ring = Math.sqrt(1 - u * u);
      const dx = ring * Math.cos(a), dy = u, dz = ring * Math.sin(a);
      const r = hemisphereRadius(side * dx, dy, dz);
      // Direction sampling crowds the short axes; thin it back toward an even surface density.
      if (random() > (r * r) / 0.92) continue;
      const groove = Math.abs(fold(side * 0.38 + dx * r, dy * r, dz * r));
      const gyrus = groove < 0.12 ? 0 : Math.min(1, (groove - 0.12) / 0.6);
      if (random() > 0.08 + 0.92 * gyrus) continue;
      const reach = r + 0.035 * (gyrus - 0.5);
      const x = side * 0.38 + dx * reach, y = 0.06 + dy * reach, z = dz * reach;
      if (side * x < 0.035 || within(cerebellum[0], x, y, z) || within(cerebellum[1], x, y, z)) continue;
      points.push(x, y, z, random(), (0.32 + 0.68 * gyrus) * (1 - 0.7 * Math.min(1, Math.max(0, (-side * dx - 0.15) / 0.6))));
    }
  }
  cerebellum.forEach((l, index) => {
    for (let i = 0; i < 2600; i++) {
      const u = random() * 2 - 1, a = random() * Math.PI * 2, ring = Math.sqrt(1 - u * u);
      const x = l[0] + ring * Math.cos(a) * l[3], y = l[1] + u * l[4], z = l[2] + ring * Math.sin(a) * l[5];
      const folium = Math.abs(Math.sin(y * 62 + z * 9));
      if (within(cerebellum[1 - index], x, y, z) || random() > 0.1 + 0.9 * folium) continue;
      points.push(x, y, z, random(), 0.3 + 0.6 * folium);
    }
  });
  const cortex = points.length / 5;
  // Brainstem, tapering beneath the cerebellum.
  for (let i = 0; i < 360; i++) {
    const t = random(), a = random() * Math.PI * 2, w = 0.085 - t * 0.02;
    points.push(Math.cos(a) * w, -0.4 - t * 0.48, -0.22 - t * 0.12 + Math.sin(a) * w, random(), 0.34);
  }
  // Interior neurons, wired to their nearest neighbours and to the cortex.
  const nodes: number[] = [];
  while (nodes.length < 1080) {
    const x = random() * 1.6 - 0.8, y = random() * 1.1 - 0.45, z = random() * 1.8 - 0.9;
    const side = x < 0 ? -1 : 1, dx = x - side * 0.38, dy = y - 0.06, length = Math.sqrt(dx * dx + dy * dy + z * z);
    if (side * x > 0.06 && length < 0.8 * hemisphereRadius((side * dx) / length, dy / length, z / length)) nodes.push(x, y, z);
  }
  for (let i = 0; i < nodes.length; i += 3) points.push(nodes[i], nodes[i + 1], nodes[i + 2], random(), 0.95);
  const lines: number[] = [];
  const link = (a: number[], from: number, b: number[], to: number) => {
    const s = random();
    lines.push(a[from], a[from + 1], a[from + 2], s, 0, b[to], b[to + 1], b[to + 2], s, 1);
  };
  const gap = (a: number[], i: number, b: number[], j: number) => {
    const x = a[i] - b[j], y = a[i + 1] - b[j + 1], z = a[i + 2] - b[j + 2];
    return Math.sqrt(x * x + y * y + z * z);
  };
  for (let i = 0; i < nodes.length; i += 3) {
    let first = -1, second = -1, firstGap = 0.48, secondGap = 0.48;
    for (let j = i + 3; j < nodes.length; j += 3) {
      const d = gap(nodes, i, nodes, j);
      if (d < 0.14 || d >= secondGap) continue;
      if (d < firstGap) { second = first; secondGap = firstGap; first = j; firstGap = d; }
      else { second = j; secondGap = d; }
    }
    if (first >= 0) link(nodes, i, nodes, first);
    if (second >= 0) link(nodes, i, nodes, second);
    if (random() < 0.45) {
      let best = -1, nearest = 0.5;
      for (let k = 0; k < 160; k++) {
        const s = Math.floor(random() * cortex) * 5, d = gap(nodes, i, points, s);
        if (d < nearest) { nearest = d; best = s; }
      }
      if (best >= 0) link(nodes, i, points, best);
    }
  }
  return { points: new Float32Array(points), lines: new Float32Array(lines), cortex };
}

export default function PointCloudBrain() {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const mount = host.current, surface = canvas.current;
    if (!mount || !surface) return;
    // Premultiplied output with additive blending: overlapping points glow instead of washing out.
    const gl = surface.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = preference.matches, visible = false, lost = false;
    let frame = 0, previous = 0, clock = 0;
    let program: WebGLProgram | null = null;
    let shaders: WebGLShader[] = [], buffers: WebGLBuffer[] = [];
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    const shape = geometry();
    // A synaptic cascade: every few seconds a wave of activity spreads from one point of the cortex.
    const ripple = [0, 0, 0, -1];
    let rippleStart = -Infinity;
    const free = () => {
      buffers.forEach(buffer => gl.deleteBuffer(buffer)); buffers = [];
      shaders.forEach(shader => gl.deleteShader(shader)); shaders = [];
      if (program) gl.deleteProgram(program); program = null;
    };
    const build = () => {
      free();
      for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
        const shader = gl.createShader(type);
        if (!shader) { free(); return false; }
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { free(); return false; }
      }
      program = gl.createProgram();
      if (!program) { free(); return false; }
      shaders.forEach(shader => gl.attachShader(program!, shader)); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { free(); return false; }
      for (const data of [shape.points, shape.lines]) {
        const buffer = gl.createBuffer();
        if (!buffer) { free(); return false; }
        buffers.push(buffer); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      }
      uniforms = Object.fromEntries(["u_time", "u_aspect", "u_size", "u_lines", "u_ripple"].map(name => [name, gl.getUniformLocation(program!, name)]));
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST);
      return true;
    };
    const pulse = () => {
      if (reduced) { ripple[3] = -1; return; }
      if (clock - rippleStart > 3.4) {
        const index = Math.floor(Math.random() * shape.cortex) * 5;
        ripple[0] = shape.points[index]; ripple[1] = shape.points[index + 1]; ripple[2] = shape.points[index + 2];
        rippleStart = clock;
      }
      const phase = (clock - rippleStart) / 2.2;
      ripple[3] = phase < 1 ? phase : -1;
    };
    const draw = () => {
      if (!program || lost) return;
      pulse();
      gl.useProgram(program); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.u_time, reduced ? 0 : clock);
      gl.uniform1f(uniforms.u_aspect, surface.width / surface.height);
      // Points keep the same apparent size at any density or canvas height.
      gl.uniform1f(uniforms.u_size, Math.min(devicePixelRatio || 1, 1.5) * Math.max(0.7, mount.clientHeight / 432));
      gl.uniform4fv(uniforms.u_ripple, ripple);
      const position = gl.getAttribLocation(program, "a_position"), seed = gl.getAttribLocation(program, "a_seed"), aux = gl.getAttribLocation(program, "a_aux");
      for (const i of [1, 0]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
        gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(seed); gl.vertexAttribPointer(seed, 1, gl.FLOAT, false, 20, 12);
        gl.enableVertexAttribArray(aux); gl.vertexAttribPointer(aux, 1, gl.FLOAT, false, 20, 16);
        gl.uniform1f(uniforms.u_lines, i);
        gl.drawArrays(i ? gl.LINES : gl.POINTS, 0, (i ? shape.lines.length : shape.points.length) / 5);
      }
      mount.dataset.ready = "true";
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const render = (now: number) => {
      frame = 0;
      if (!visible || reduced || lost || document.hidden || !program) return;
      if (previous && now - previous < 32) { frame = requestAnimationFrame(render); return; }
      clock += previous ? Math.min(0.075, (now - previous) / 1000) : 0;
      previous = now; draw(); frame = requestAnimationFrame(render);
    };
    const request = () => { if (!frame && visible && !reduced && !lost && !document.hidden && program) frame = requestAnimationFrame(render); };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      surface.width = Math.max(1, Math.round(mount.clientWidth * dpr)); surface.height = Math.max(1, Math.round(mount.clientHeight * dpr));
      gl.viewport(0, 0, surface.width, surface.height); draw(); request();
    };
    const motion = (event: MediaQueryListEvent) => { reduced = event.matches; stop(); draw(); request(); };
    const visibility = () => { if (document.hidden) stop(); else request(); };
    const onLost = (event: Event) => { event.preventDefault(); lost = true; stop(); delete mount.dataset.ready; };
    const onRestored = () => { lost = false; if (build()) resize(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); else stop(); });
    const size = new ResizeObserver(resize);
    observer.observe(mount); size.observe(mount);
    preference.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility);
    surface.addEventListener("webglcontextlost", onLost); surface.addEventListener("webglcontextrestored", onRestored);
    if (build()) resize();
    return () => {
      stop(); free(); observer.disconnect(); size.disconnect();
      preference.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility);
      surface.removeEventListener("webglcontextlost", onLost); surface.removeEventListener("webglcontextrestored", onRestored);
    };
  }, []);
  return (
    <div className="point-cloud-brain" ref={host} role="img" aria-label="A glowing emerald and cyan point-cloud brain that slowly turns while synapse flashes travel through it">
      <svg className="brain-fallback" viewBox="0 0 400 400" aria-hidden="true">
        <defs><pattern id="brain-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#73edda" /></pattern></defs>
        <path d="M190 76C135 38 58 79 54 145C19 182 43 239 70 259C76 305 139 323 188 289L195 151ZM210 76C265 38 342 79 346 145C381 182 357 239 330 259C324 305 261 323 212 289L205 151ZM163 300Q200 321 236 300L215 332L208 361H190L184 330Z" fill="url(#brain-dots)" />
      </svg>
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}
