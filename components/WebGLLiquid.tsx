"use client";

/**
 * Adapted from Componentry WebGL Liquid, MIT, Copyright (c) 2026 Harsh Jadhav.
 * Source: https://componentry.dev/r/webgl-liquid.json
 * Full notice: /vendor/componentry-LICENSE.txt
 */
import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_colorDeep;
uniform vec3 u_colorMid;
uniform vec3 u_colorHighlight;
uniform float u_speed;
uniform float u_flowStrength;
uniform float u_grain;
uniform float u_contrast;
uniform float u_opacity;
uniform float u_reveal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.86, 0.51, -0.51, 0.86);
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 applyContrast(vec3 c, float contrast) {
  return clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * (0.14 * u_speed);
  vec2 aspect = vec2(u_res.x / max(u_res.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  vec2 flowP = vec2(p.x * 1.1, p.y - t * 0.35);
  float n1 = fbm(flowP * 2.8 + vec2(0.0, t * 0.2));
  float n2 = fbm((flowP + n1 * 0.45) * 4.0 - vec2(0.0, t * 0.35));
  float n3 = fbm((flowP + n2 * 0.4) * 6.5 + vec2(t * 0.15, 0.0));

  float structure = n3 * 1.15 + (n2 - 0.5) * 0.5;
  structure += (n1 - 0.5) * 0.3 * u_flowStrength;

  float lowBand = smoothstep(0.18, 0.6, structure);
  float highBand = smoothstep(0.62, 1.08, structure);
  vec3 col = mix(u_colorDeep, u_colorMid, lowBand);
  col = mix(col, u_colorHighlight, highBand);

  float glow = smoothstep(0.52, 0.95, structure) * (0.35 + 0.5 * u_flowStrength);
  col += glow * u_colorHighlight * 0.35;

  float verticalMask = smoothstep(1.05, 0.05, uv.y);
  verticalMask = pow(verticalMask, 1.1);

  float vignette = smoothstep(1.28, 0.36, length(uv - 0.5));
  col *= mix(0.9, 1.05, vignette);

  col = applyContrast(col, u_contrast);

  float dither = (hash(gl_FragCoord.xy + t * 10.0) - 0.5) * u_grain;
  col += dither;

  float alpha = verticalMask * smoothstep(0.08, 0.95, structure);
  alpha *= smoothstep(0.0, 0.28, u_reveal - uv.x);
  alpha *= u_opacity;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`;

export interface WebGLLiquidProps {
  colorDeep?: string;
  colorMid?: string;
  colorHighlight?: string;
  speed?: number;
  flowStrength?: number;
  grain?: number;
  contrast?: number;
  opacity?: number;
  /** Fraction of the capped physical render resolution; the canvas stays full-screen. */
  renderScale?: number;
  className?: string;
}

type Resources = {
  program: WebGLProgram;
  vertex: WebGLShader;
  fragment: WebGLShader;
  buffer: WebGLBuffer;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

function rgb(hex: string, fallback: string): [number, number, number] {
  const value = /^#?[\da-f]{6}$/i.test(hex.trim())
    ? hex.trim().replace(/^#/, "")
    : fallback.slice(1);
  return [0, 2, 4].map(
    (start) => parseInt(value.slice(start, start + 2), 16) / 255,
  ) as [number, number, number];
}

export function WebGLLiquid({
  colorDeep = "#04050b",
  colorMid = "#134d93",
  colorHighlight = "#8cecff",
  speed = 0.75,
  flowStrength = 1,
  grain = 0.025,
  contrast = 1.1,
  opacity = 0.95,
  renderScale = 0.72,
  className = "",
}: WebGLLiquidProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mount = host.current,
      surface = canvas.current;
    if (!mount || !surface) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrastPreference = matchMedia("(prefers-contrast: more)");
    let dispose = () => {};

    const setup = () => {
      dispose();
      delete mount.dataset.ready;
      delete mount.dataset.contextLost;
      if (reduced.matches || contrastPreference.matches) return;
      const gl = surface.getContext("webgl", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      });
      if (!gl) return;
      let resources: Resources | null = null;
      let frame = 0,
        lastFrame = 0,
        clock = 0,
        visible = false,
        lost = false;
      let software = false;
      try {
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        software =
          !!debug &&
          /swiftshader|llvmpipe|software|mesa offscreen/i.test(
            String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)),
          );
      } catch {
        /* Capability information is optional. */
      }
      const colors = [
        rgb(colorDeep, "#04050b"),
        rgb(colorMid, "#134d93"),
        rgb(colorHighlight, "#8cecff"),
      ];

      const free = () => {
        if (!resources) return;
        gl.deleteBuffer(resources.buffer);
        gl.deleteProgram(resources.program);
        gl.deleteShader(resources.vertex);
        gl.deleteShader(resources.fragment);
        resources = null;
      };
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };
      const build = () => {
        free();
        const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER),
          fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        if (!vertex || !fragment) {
          if (vertex) gl.deleteShader(vertex);
          if (fragment) gl.deleteShader(fragment);
          return false;
        }
        const program = gl.createProgram(),
          buffer = gl.createBuffer();
        if (!program || !buffer) {
          if (program) gl.deleteProgram(program);
          if (buffer) gl.deleteBuffer(buffer);
          gl.deleteShader(vertex);
          gl.deleteShader(fragment);
          return false;
        }
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.deleteProgram(program);
          gl.deleteBuffer(buffer);
          gl.deleteShader(vertex);
          gl.deleteShader(fragment);
          return false;
        }
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW,
        );
        const position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        const uniforms: Resources["uniforms"] = {};
        for (const name of [
          "u_res",
          "u_time",
          "u_colorDeep",
          "u_colorMid",
          "u_colorHighlight",
          "u_speed",
          "u_flowStrength",
          "u_grain",
          "u_contrast",
          "u_opacity",
          "u_reveal",
        ])
          uniforms[name] = gl.getUniformLocation(program, name);
        resources = { program, vertex, fragment, buffer, uniforms };
        gl.uniform3fv(uniforms.u_colorDeep, colors[0]);
        gl.uniform3fv(uniforms.u_colorMid, colors[1]);
        gl.uniform3fv(uniforms.u_colorHighlight, colors[2]);
        gl.uniform1f(uniforms.u_speed, Math.max(0, speed));
        gl.uniform1f(uniforms.u_flowStrength, Math.max(0, flowStrength));
        gl.uniform1f(uniforms.u_grain, Math.max(0, grain));
        gl.uniform1f(uniforms.u_contrast, Math.max(0, contrast));
        gl.uniform1f(uniforms.u_opacity, Math.min(1, Math.max(0, opacity)));
        // The existing portfolio content appears immediately; no shader reveal gates navigation.
        gl.uniform1f(uniforms.u_reveal, 1.28);
        return true;
      };
      const render = (now: number) => {
        frame = 0;
        if (!visible || lost || document.hidden || !resources) return;
        if (lastFrame && now - lastFrame < (software ? 80 : 32)) {
          frame = requestAnimationFrame(render);
          return;
        }
        clock += lastFrame ? Math.min(0.075, (now - lastFrame) / 1000) : 0;
        lastFrame = now;
        gl.useProgram(resources.program);
        gl.uniform1f(resources.uniforms.u_time, clock);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        mount.dataset.ready = "true";
        frame = requestAnimationFrame(render);
      };
      const request = () => {
        if (!frame && visible && !lost && !document.hidden && resources)
          frame = requestAnimationFrame(render);
      };
      const resize = () => {
        if (!resources || lost) return;
        const { width, height } = mount.getBoundingClientRect();
        const cap = software ? 480 : 1440;
        const scale =
          Math.max(0.35, Math.min(1, renderScale)) *
          Math.min(devicePixelRatio || 1, 1.25) *
          Math.min(1, cap / Math.max(width, 1), 900 / Math.max(height, 1));
        surface.width = Math.max(1, Math.round(width * scale));
        surface.height = Math.max(1, Math.round(height * scale));
        gl.viewport(0, 0, surface.width, surface.height);
        gl.useProgram(resources.program);
        gl.uniform2f(resources.uniforms.u_res, surface.width, surface.height);
        request();
      };
      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
          lastFrame = 0;
        } else request();
      };
      const onLost = (event: Event) => {
        event.preventDefault();
        lost = true;
        cancelAnimationFrame(frame);
        frame = 0;
        lastFrame = 0;
        delete mount.dataset.ready;
        mount.dataset.contextLost = "true";
      };
      const onRestored = () => {
        lost = false;
        if (build()) {
          delete mount.dataset.contextLost;
          resize();
          request();
        }
      };
      surface.addEventListener("webglcontextlost", onLost);
      surface.addEventListener("webglcontextrestored", onRestored);
      document.addEventListener("visibilitychange", visibility);
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) {
          cancelAnimationFrame(frame);
          frame = 0;
          lastFrame = 0;
        } else request();
      });
      io.observe(mount);
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      if (build()) resize();
      dispose = () => {
        cancelAnimationFrame(frame);
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", visibility);
        surface.removeEventListener("webglcontextlost", onLost);
        surface.removeEventListener("webglcontextrestored", onRestored);
        free();
        delete mount.dataset.ready;
        delete mount.dataset.contextLost;
      };
    };
    setup();
    reduced.addEventListener("change", setup);
    contrastPreference.addEventListener("change", setup);
    return () => {
      dispose();
      reduced.removeEventListener("change", setup);
      contrastPreference.removeEventListener("change", setup);
    };
  }, [
    colorDeep,
    colorMid,
    colorHighlight,
    speed,
    flowStrength,
    grain,
    contrast,
    opacity,
    renderScale,
  ]);

  return (
    <div ref={host} className={`webgl-liquid ${className}`} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}
export default WebGLLiquid;
