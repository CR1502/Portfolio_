import assert from "node:assert/strict";
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:3210", { waitUntil: "networkidle" });
await page
  .locator('.webgl-liquid[data-ready="true"]')
  .waitFor({ timeout: 15000 });
await page.locator(".webgl-liquid canvas").evaluate((canvas) => {
  const gl = canvas.getContext("webgl");
  window.__loss = gl.getExtension("WEBGL_lose_context");
  window.__loss.loseContext();
});
await page.locator('.webgl-liquid[data-context-lost="true"]').waitFor();
assert.equal(
  await page.locator(".webgl-liquid").getAttribute("data-ready"),
  null,
);
await page.waitForTimeout(200);
await page.evaluate(() => window.__loss.restoreContext());
await page
  .locator('.webgl-liquid[data-ready="true"]')
  .waitFor({ timeout: 15000 });
assert.equal(
  await page.locator(".webgl-liquid").getAttribute("data-context-lost"),
  null,
);
console.log("✓ liquid context-loss fallback and restoration");
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForTimeout(200);
assert.equal(
  await page.locator(".webgl-liquid").getAttribute("data-ready"),
  null,
);
assert.equal(
  await page
    .locator(".webgl-liquid canvas")
    .evaluate((el) => getComputedStyle(el).display),
  "none",
);
assert.ok(
  await page.locator("video").evaluateAll((vs) => vs.every((v) => v.paused)),
);
console.log("✓ dynamic Reduced Motion stops graphics");
assert.deepEqual(errors, []);
await writeFile(
  ".audit/liquid-check.json",
  JSON.stringify(
    { contextRecovery: true, reducedMotion: true, errors },
    null,
    2,
  ),
);
await browser.close();
