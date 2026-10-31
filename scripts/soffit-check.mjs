import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3210";
// Final override block from the supplied Soffit brief, not its earlier example.
const EXPECTED = {
  bgColor: "#2a2436", colorA: "#4e4468", colorB: "#8f7fc0",
  colorC: "#cfc4e8", colorD: "#f5eeff", ambient: .24, amount: .2,
  bounce: .38, bounceCurve: 4.25, breathe: .29, contrast: 2.45,
  cursor: 1, curve: 3.32, direct: .97, dither: .58, flow: .475,
  glow: .38, grain: 0, grainAnim: 0, horizon: .36, lacunarity: 1.99,
  lift: .11, maxDpr: 1, midpoint: .57, moteScale: 7, motes: .074,
  parallax: .0137, rock: .12, roughness: .29, scale: 1, sink: .24,
  speed: .33, spillCentre: .3, spillFloor: .26, spillWidth: 2.18,
  spread: .41, steer: -.13, sweep: .5, tilt: 1.87, vignette: .21,
  warp: 2.58, warpScale: .78,
};
const results = [];
async function test(name, run) {
  try { await run(); results.push({ name, pass: true }); console.log("✓", name); }
  catch (error) {
    results.push({ name, pass: false, error: String(error) });
    console.log("✗", name, String(error));
  }
}
const closeTo = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) < 1e-5, `${label}: ${actual} != ${expected}`);

await test("Source uses exact final CONFIG and byte-identical supplied fragment shader", async () => {
  const source = await readFile(new URL("../lib/soffit-shader.ts", import.meta.url), "utf8");
  const config = source.match(/SOFFIT_CONFIG\s*=\s*(\{[\s\S]*?\})\s*as const/);
  assert.ok(config, "CONFIG must remain a JSON-compatible literal");
  assert.deepEqual(JSON.parse(config[1]), EXPECTED);
  const fragment = source.match(/SOFFIT_FRAGMENT_SHADER\s*=\s*`([\s\S]*?)`;/);
  assert.ok(fragment);
  // SHA-256 of the attachment's first GLSL code block, excluding fence/newline.
  assert.equal(createHash("sha256").update(fragment[1]).digest("hex"),
    "17d8762db4de15d12e765506c11431958349c6626f59bfaf4fbb12fd3f9c492f");
});

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  const host = page.locator(".soffit-background"), canvas = host.locator("canvas");
  await test("Opaque WebGL2 context compiles and becomes ready", async () => {
    await page.locator('.soffit-background[data-ready="true"]').waitFor();
    const state = await canvas.evaluate((surface) => {
      const gl = surface.getContext("webgl2");
      return { webgl2: gl instanceof WebGL2RenderingContext,
        alpha: gl?.getContextAttributes()?.alpha,
        linked: gl && gl.getProgramParameter(gl.getParameter(gl.CURRENT_PROGRAM), gl.LINK_STATUS) };
    });
    assert.deepEqual(state, { webgl2: true, alpha: false, linked: true });
  });
  const uniforms = () => canvas.evaluate((surface) => {
    const gl = surface.getContext("webgl2"), program = gl.getParameter(gl.CURRENT_PROGRAM);
    const values = {};
    for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
      const name = gl.getActiveUniform(program, i).name;
      const value = gl.getUniform(program, gl.getUniformLocation(program, name));
      values[name] = ArrayBuffer.isView(value) ? Array.from(value) : value;
    }
    return values;
  });
  await test("Actual linked shader receives every final CONFIG uniform", async () => {
    const values = await uniforms();
    for (const [key, expected] of Object.entries(EXPECTED)) {
      if (["cursor", "maxDpr"].includes(key)) continue;
      const name = key === "bgColor" ? "uBg" : `u${key[0].toUpperCase()}${key.slice(1)}`;
      assert.ok(name in values, `${name} is active`);
      if (typeof expected === "string") {
        const rgb = [1, 3, 5].map((offset) => parseInt(expected.slice(offset, offset + 2), 16) / 255);
        rgb.forEach((value, i) => closeTo(values[name][i], value, `${name}[${i}]`));
      } else closeTo(values[name], expected, name);
    }
  });
  await test("Drawing buffer caps DPR at one and canvas has no CSS transformation", async () => {
    for (const size of [{ width: 1280, height: 900 }, { width: 740, height: 810 }]) {
      await page.setViewportSize(size);
      await page.waitForFunction(({ width, height }) => {
        const c = document.querySelector(".soffit-background canvas");
        return c.width === width && c.height === height;
      }, size);
      const state = await canvas.evaluate((surface) => {
        const css = getComputedStyle(surface), gl = surface.getContext("webgl2");
        return { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight,
          transform: css.transform, filter: css.filter, animation: css.animationName };
      });
      assert.deepEqual(state, { ...size, transform: "none", filter: "none", animation: "none" });
      assert.deepEqual((await uniforms()).iResolution, [size.width, size.height]);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
  });
  await test("Pointer input advances smoothed aspect-corrected shader coordinates", async () => {
    await page.mouse.move(180, 700);
    await page.waitForTimeout(250);
    const before = await uniforms();
    await page.mouse.move(1120, 150);
    await page.waitForTimeout(120);
    const during = await uniforms();
    await page.waitForTimeout(450);
    const after = await uniforms();
    const target = [(1120 / 1280 - .5) * (1280 / 900), .5 - 150 / 900];
    assert.ok(during.iTime > before.iTime);
    assert.notDeepEqual(during.iMouse, before.iMouse);
    const distance = (v) => Math.hypot(v[0] - target[0], v[1] - target[1]);
    assert.ok(distance(after.iMouse) < distance(during.iMouse), "follower approaches target over time");
    assert.ok(distance(during.iMouse) > 1e-5, "pointer is followed, not snapped");
  });
  await test("Dynamic Reduced Motion freezes all shader animation inputs", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => {
      const gl = document.querySelector(".soffit-background canvas").getContext("webgl2");
      const program = gl.getParameter(gl.CURRENT_PROGRAM);
      return matchMedia("(prefers-reduced-motion: reduce)").matches &&
        gl.getUniform(program, gl.getUniformLocation(program, "iTime")) === 0;
    });
    const before = await uniforms();
    await page.mouse.move(100, 100);
    await page.waitForTimeout(450);
    const after = await uniforms();
    assert.equal(before.iTime, 0);
    assert.equal(after.iTime, before.iTime);
    assert.deepEqual(after.iMouse, before.iMouse);
    assert.deepEqual(after.iResolution, before.iResolution);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(() => {
      const gl = document.querySelector(".soffit-background canvas").getContext("webgl2");
      const program = gl.getParameter(gl.CURRENT_PROGRAM);
      return gl.getUniform(program, gl.getUniformLocation(program, "iTime")) > 0;
    });
    assert.ok((await uniforms()).iTime > 0);
  });
  await test("Real WebGL context loss reveals fallback and restores rendering", async () => {
    await canvas.evaluate((surface) => {
      const extension = surface.getContext("webgl2").getExtension("WEBGL_lose_context");
      if (!extension) throw new Error("WEBGL_lose_context unavailable");
      window.__soffitLoss = extension;
      extension.loseContext();
    });
    await page.locator('.soffit-background[data-context-lost="true"]').waitFor();
    assert.equal(await host.getAttribute("data-ready"), null);
    assert.equal(await canvas.evaluate((c) => getComputedStyle(c).visibility), "hidden");
    assert.notEqual(await host.evaluate((h) => getComputedStyle(h).backgroundImage), "none");
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__soffitLoss.restoreContext());
    await page.locator('.soffit-background[data-ready="true"]').waitFor();
    assert.equal(await host.getAttribute("data-context-lost"), null);
    assert.equal(await canvas.evaluate((c) => getComputedStyle(c).visibility), "visible");
    assert.ok((await uniforms()).iTime >= 0);
  });
  await test("Main page has no JavaScript errors", async () => assert.deepEqual(errors, []));
  await page.close();

  await test("Unavailable WebGL2 retains a visible CSS fallback and usable content", async () => {
    const fallback = await browser.newPage({ viewport: { width: 393, height: 852 } });
    const fallbackErrors = [];
    fallback.on("pageerror", (error) => fallbackErrors.push(String(error)));
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        return kind === "webgl2" ? null : original.call(this, kind, ...args);
      };
    });
    try {
      await fallback.goto(BASE, { waitUntil: "networkidle" });
      const state = await fallback.locator(".soffit-background").evaluate((host) => ({
        ready: host.dataset.ready ?? null,
        display: getComputedStyle(host).display,
        background: getComputedStyle(host).backgroundImage,
        rect: { width: host.getBoundingClientRect().width, height: host.getBoundingClientRect().height },
        canvasVisibility: getComputedStyle(host.querySelector("canvas")).visibility,
      }));
      assert.equal(state.ready, null);
      assert.notEqual(state.display, "none");
      assert.match(state.background, /gradient/);
      assert.deepEqual(state.rect, { width: 393, height: 852 });
      assert.equal(state.canvasVisibility, "hidden");
      assert.ok(await fallback.locator("h1").isVisible());
      assert.deepEqual(fallbackErrors, []);
    } finally { await fallback.close(); }
  });
} catch (error) {
  results.push({ name: "Soffit check setup/runtime", pass: false, error: String(error) });
} finally {
  await browser.close();
  await mkdir(".audit", { recursive: true });
  await writeFile(".audit/soffit-check.json", JSON.stringify(results, null, 2));
  if (results.some((result) => !result.pass)) process.exitCode = 1;
}
