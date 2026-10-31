import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch();
await mkdir(".audit/palettes", { recursive: true });
const reports = [];
function luminance(hex) {
  const rgb = hex
    .replace("#", "")
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
for (const palette of ["cobalt", "acid", "cherry"]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(`http://localhost:3210/?palette=${palette}`, {
    waitUntil: "networkidle",
  });
  await page.screenshot({ path: `.audit/palettes/${palette}-hero.png` });
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      ["--ink-900", "--ink-700", "--text", "--muted", "--cyan", "--amber"].map(
        (k) => [k, s.getPropertyValue(k).trim()],
      ),
    );
  });
  const ratios = {
    body: contrast(tokens["--text"], tokens["--ink-700"]),
    secondary: contrast(tokens["--muted"], tokens["--ink-700"]),
    primary: contrast(tokens["--cyan"], tokens["--ink-900"]),
    accent: contrast(tokens["--amber"], tokens["--ink-900"]),
  };
  if (Object.values(ratios).some((value) => value < 4.5))
    throw new Error(`${palette} insufficient contrast`);
  await page
    .locator("#projects")
    .evaluate((el) =>
      window.scrollTo({ top: el.offsetTop, behavior: "instant" }),
    );
  await page.waitForTimeout(200);
  await page.screenshot({ path: `.audit/palettes/${palette}-projects.png` });
  await page
    .locator("#skills")
    .evaluate((el) =>
      window.scrollTo({ top: el.offsetTop, behavior: "instant" }),
    );
  await page.waitForTimeout(200);
  await page.screenshot({ path: `.audit/palettes/${palette}-skills.png` });
  reports.push({ palette, ratios });
  console.log(palette, ratios);
  await page.close();
}
await browser.close();
await writeFile(
  ".audit/palettes/contrast.json",
  JSON.stringify(reports, null, 2),
);
