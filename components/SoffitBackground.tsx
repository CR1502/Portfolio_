"use client";

import { useEffect, useRef } from "react";
import {
  SOFFIT_CONFIG,
  SOFFIT_FRAGMENT_SHADER,
  SOFFIT_VERTEX_SHADER,
} from "@/lib/soffit-shader";

type Resources = {
  program: WebGLProgram;
  vertex: WebGLShader;
  fragment: WebGLShader;
  vao: WebGLVertexArrayObject;
  time: WebGLUniformLocation | null;
  mouse: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
};

/** A single opaque, full-resolution WebGL2 triangle; all field motion lives in GLSL. */
export default function SoffitBackground() {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mount = host.current;
    const surface = canvas.current;
    if (!mount || !surface) return;
    const gl = surface.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    // The wrapper's real CSS gradient remains visible if WebGL2 is unavailable.
    if (!gl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Keep media-query evaluation out of the render loop. Reading .matches
    // during a pending style update can consume Chromium's change notification;
    // the change event is the source of truth after this initial snapshot.
    let reducedMotion = reduced.matches;
    let resources: Resources | null = null;
    let frame = 0;
    let resizeFrame = 0;
    let prevT = 0;
    let clock = 0;
    let visible = true;
    let lost = false;
    let disposed = false;
    const mouse = { x: 0, y: 0, ax: 0, ay: 0, tx: 0, ty: 0 };

    function free() {
      if (!resources) return;
      gl!.deleteVertexArray(resources.vao);
      gl!.deleteProgram(resources.program);
      gl!.deleteShader(resources.vertex);
      gl!.deleteShader(resources.fragment);
      resources = null;
    }

    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function build() {
      free();
      const vertex = compile(gl!.VERTEX_SHADER, SOFFIT_VERTEX_SHADER);
      const fragment = compile(gl!.FRAGMENT_SHADER, SOFFIT_FRAGMENT_SHADER);
      const program = gl!.createProgram();
      const vao = gl!.createVertexArray();
      if (!vertex || !fragment || !program || !vao) {
        if (vertex) gl!.deleteShader(vertex);
        if (fragment) gl!.deleteShader(fragment);
        if (program) gl!.deleteProgram(program);
        if (vao) gl!.deleteVertexArray(vao);
        return false;
      }
      gl!.attachShader(program, vertex);
      gl!.attachShader(program, fragment);
      gl!.linkProgram(program);
      if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
        gl!.deleteShader(vertex);
        gl!.deleteShader(fragment);
        gl!.deleteProgram(program);
        gl!.deleteVertexArray(vao);
        return false;
      }
      gl!.useProgram(program);
      gl!.bindVertexArray(vao);
      resources = {
        program,
        vertex,
        fragment,
        vao,
        time: gl!.getUniformLocation(program, "iTime"),
        mouse: gl!.getUniformLocation(program, "iMouse"),
        resolution: gl!.getUniformLocation(program, "iResolution"),
      };
      for (const [key, value] of Object.entries(SOFFIT_CONFIG)) {
        // bgColor is named uBg in the supplied shader/engine. cursor and maxDpr
        // are engine controls, so neither has a corresponding shader uniform.
        if (key === "cursor" || key === "maxDpr") continue;
        const name =
          key === "bgColor" ? "uBg" : `u${key[0].toUpperCase()}${key.slice(1)}`;
        const location = gl!.getUniformLocation(program, name);
        if (typeof value === "string") {
          gl!.uniform3f(
            location,
            ...([0, 2, 4].map(
              (start) => parseInt(value.slice(start + 1, start + 3), 16) / 255,
            ) as [number, number, number]),
          );
        } else gl!.uniform1f(location, value);
      }
      return true;
    }

    function draw() {
      if (!resources || lost || disposed) return;
      gl!.useProgram(resources.program);
      gl!.bindVertexArray(resources.vao);
      gl!.uniform1f(resources.time, clock);
      gl!.uniform2f(resources.mouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      surface!.style.visibility = "visible";
      mount!.dataset.ready = "true";
    }

    function resize() {
      if (!resources || lost || disposed) return;
      const dpr = Math.min(window.devicePixelRatio || 1, SOFFIT_CONFIG.maxDpr);
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
      if (surface!.width !== width || surface!.height !== height) {
        surface!.width = width;
        surface!.height = height;
      }
      gl!.viewport(0, 0, width, height);
      gl!.useProgram(resources.program);
      gl!.uniform2f(resources.resolution, width, height);
      draw();
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      prevT = 0;
    }

    function request() {
      if (
        !frame &&
        resources &&
        !lost &&
        !disposed &&
        visible &&
        !document.hidden &&
        !reducedMotion
      ) {
        prevT = performance.now();
        frame = requestAnimationFrame(render);
      }
    }

    function render(now: number) {
      frame = 0;
      if (
        !resources ||
        lost ||
        disposed ||
        !visible ||
        document.hidden ||
        reducedMotion
      )
        return;
      const raw = now - prevT;
      prevT = now;
      const ms = raw > 50 ? 50 : raw < 4.167 ? 4.167 : raw;
      const s = ms > 36.7 ? 2.2 : ms * 0.06;
      clock += ms * 0.001;
      const kLead = 0.105 * s;
      const kBody = 0.043 * s;
      mouse.ax += (mouse.tx - mouse.ax) * kLead;
      mouse.ay += (mouse.ty - mouse.ay) * kLead;
      mouse.x += (mouse.ax - mouse.x) * kBody;
      mouse.y += (mouse.ay - mouse.y) * kBody;
      draw();
      frame = requestAnimationFrame(render);
    }

    function aim(event: PointerEvent) {
      if (reducedMotion) return;
      const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      mouse.tx = (event.clientX / window.innerWidth - 0.5) * aspect;
      mouse.ty = 0.5 - event.clientY / window.innerHeight;
    }

    function queueResize() {
      if (resizeFrame || disposed) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    }

    function visibility() {
      if (document.hidden) stop();
      else request();
    }

    function preference(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      stop();
      if (reducedMotion) {
        // Use the exact shader's initial frame, rather than a different palette.
        clock = 0;
        Object.assign(mouse, { x: 0, y: 0, ax: 0, ay: 0, tx: 0, ty: 0 });
        draw();
      } else request();
    }

    function contextLost(event: Event) {
      event.preventDefault();
      lost = true;
      stop();
      cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
      delete mount!.dataset.ready;
      mount!.dataset.contextLost = "true";
      surface!.style.visibility = "hidden";
    }

    function contextRestored() {
      if (disposed) return;
      lost = false;
      delete mount!.dataset.contextLost;
      if (build()) {
        resize();
        request();
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) request();
      else stop();
    });
    observer.observe(mount);
    window.addEventListener("pointermove", aim, { passive: true });
    window.addEventListener("pointerdown", aim, { passive: true });
    window.addEventListener("resize", queueResize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", preference);
    surface.addEventListener("webglcontextlost", contextLost);
    surface.addEventListener("webglcontextrestored", contextRestored);
    if (build()) {
      resize();
      request();
    }

    return () => {
      disposed = true;
      stop();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      window.removeEventListener("pointermove", aim);
      window.removeEventListener("pointerdown", aim);
      window.removeEventListener("resize", queueResize);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", preference);
      surface.removeEventListener("webglcontextlost", contextLost);
      surface.removeEventListener("webglcontextrestored", contextRestored);
      free();
      surface.style.visibility = "hidden";
      delete mount.dataset.ready;
      delete mount.dataset.contextLost;
    };
  }, []);

  return (
    <div
      ref={host}
      className="soffit-background"
      aria-hidden="true"
      style={{
        background:
          "linear-gradient(165deg, #4e4468 0%, #2a2436 58%, #8f7fc0 100%)",
      }}
    >
      <canvas ref={canvas} style={{ visibility: "hidden" }} />
    </div>
  );
}
