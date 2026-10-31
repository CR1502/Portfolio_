import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const results = [];
const BASE = process.env.BASE_URL || "http://localhost:3210";
async function test(name, run) {
  try {
    await run();
    results.push({ name, pass: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, pass: false, error: String(error) });
    console.log(`✗ ${name}: ${error.message}`);
  }
}
const errors = [];
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const page = await desktop.newPage();
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
await mkdir(".audit", { recursive: true });
await page.screenshot({ path: ".audit/hero-desktop.png" });
await test("Scroll drives the background and the restored landscape responds directly to the pointer", async () => {
  const before = await page
    .locator(".interactive-field")
    .evaluate((el) => el.toDataURL());
  await page.evaluate(() => window.scrollTo({ top: 450, behavior: "instant" }));
  await page.waitForTimeout(150);
  assert.notEqual(
    await page.locator(".interactive-field").evaluate((el) => el.toDataURL()),
    before,
  );
  assert.equal(await page.locator(".neural-model").count(), 0);
  assert.equal(await page.locator(".retrieval-atlas svg").count(), 1);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
});
await test("Index works and private message/callback forms replace contact links", async () => {
  await page.getByRole("button", { name: "Open navigation" }).click();
  assert.equal(
    await page.locator("#nav-sections").getAttribute("data-open"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#nav-sections").getAttribute("data-open"),
    "false",
  );
  assert.equal(await page.locator('#connect a[href^="mailto:"]').count(), 0);
  assert.equal(await page.locator('#connect a[href^="tel:"]').count(), 0);
  assert.equal(await page.locator(".contact-reveal").count(), 0);
});
await test("Landscape responds to pointer and project scenes replace each other", async () => {
  const core = page.locator(".retrieval-atlas");
  const box = await core.boundingBox();
  const path = core.locator("svg"),
    before = await path.evaluate(el=>getComputedStyle(el).transform);
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await page.waitForTimeout(160);
  assert.notEqual(await path.evaluate(el=>getComputedStyle(el).transform), before);
  await page
    .locator("#projects")
    .evaluate((el) =>
      window.scrollTo({
        top: el.offsetTop + innerHeight * 0.65,
        behavior: "instant",
      }),
    );
  await page.waitForTimeout(160);
  assert.equal(
    await page.locator('.project-piece[aria-hidden="false"] h3').textContent(),
    "KubeServe",
  );
  assert.ok(
    await page
      .locator(".project-piece")
      .first()
      .evaluate((el) => el.inert),
  );
  await page
    .locator("#projects")
    .evaluate((el) =>
      window.scrollTo({ top: el.offsetTop, behavior: "instant" }),
    );
  await page.waitForTimeout(160);
});
await test("Experience categories and callback form fields are correct", async () => {
  assert.deepEqual(
    await page.locator(".experience-category-title").allTextContents(),
    ["Technical experience", "Teaching"],
  );
  assert.equal(
    await page
      .locator(".experience-category")
      .first()
      .locator(".experience-row")
      .count(),
    2,
  );
  await page
    .getByRole("button", { name: "Request a call", exact: true })
    .evaluate((el) => el.click());
  assert.equal(await page.locator('input[name="phone"]').count(), 1);
  assert.equal(await page.locator('input[name="consent"]').count(), 1);
  await page
    .getByRole("button", { name: "Send a message", exact: true })
    .evaluate((el) => el.click());
  assert.equal(await page.locator('input[name="phone"]').count(), 0);
});
await test("About exists and Experience stays above Projects", async () => {
  assert.deepEqual(
    await page
      .locator("main > section[id]")
      .evaluateAll((els) => els.slice(0, 4).map((el) => el.id)),
    ["home", "about", "experience", "projects"],
  );
});
await test("Native scrolling and a fast project pin", async () => {
  assert.equal(
    await page
      .locator(
        ".lenis-active, .chrome-object, .spatial-background, .motion-permission",
      )
      .count(),
    0,
  );
  assert.equal(
    await page
      .locator(".intro-sticky")
      .evaluate((el) => getComputedStyle(el).position),
    "relative",
  );
  const pin = await page.locator("#projects").evaluate((el) => {
    return {
      actual: el.getBoundingClientRect().height - innerHeight,
      expected: 5 * innerHeight * 0.65,
    };
  });
  assert.ok(Math.abs(pin.actual - pin.expected) < 2);
});
await test("Six distinct project sketches and twelve project entry points", async () => {
  assert.equal(await page.locator(".project-visual").count(), 6);
  assert.equal(
    new Set(
      await page
        .locator(".project-visual")
        .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label"))),
    ).size,
    6,
  );
  assert.equal(await page.locator(".project-open, .experiment").count(), 12);
});
await test("Project dialog is local glass, traps focus, and restores it on Escape", async () => {
  await page.locator("#projects").evaluate((el) => el.scrollIntoView());
  await page.waitForTimeout(800);
  const trigger = page.locator(".project-open").first();
  await trigger.click();
  const modal = page.locator("dialog[open]");
  await modal.waitFor();
  const material = await modal.evaluate((el) => ({
    backdrop: getComputedStyle(el, "::backdrop").backdropFilter,
    bg: getComputedStyle(el, "::backdrop").backgroundColor,
    focus: el.contains(document.activeElement),
    rect: el.getBoundingClientRect().toJSON(),
  }));
  assert.equal(material.backdrop, "none");
  assert.equal(material.bg, "rgba(0, 0, 0, 0)");
  assert.ok(material.focus);
  assert.ok(material.rect.left >= 0 && material.rect.right <= 1441);
  assert.ok(
    Math.abs(material.rect.left - (1440 - material.rect.width) / 2) < 2,
    "Dialog should be centered",
  );
  await page.screenshot({ path: ".audit/project-dialog.png" });
  await page.keyboard.press("Shift+Tab");
  assert.ok(await modal.evaluate((el) => el.contains(document.activeElement)));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.ok(await trigger.evaluate((el) => el === document.activeElement));
});
await test("All twelve projects open the correct notes", async () => {
  // Exercise handlers and content independently of each platform's scrolling.
  const triggers = page.locator(".project-open, .experiment");
  for (let i = 0; i < 12; i++) {
    const trigger = triggers.nth(i);
    const label = await trigger.evaluate((el) =>
      el.getAttribute("aria-labelledby")
        ? document.getElementById(el.getAttribute("aria-labelledby"))
            .textContent
        : el.querySelector(".experiment-name").textContent,
    );
    if (i >= 6) await trigger.click();
    else await trigger.evaluate((el) => el.click());
    await page.locator("dialog[open]").waitFor({ timeout: 5000 });
    assert.equal(
      await page.locator("#dialog-project-title").textContent(),
      label,
    );
    if (label === "KubeServe")
      assert.match(
        await page.locator("dialog").textContent(),
        /CPU-only, single-node/,
      );
    await page.keyboard.press("Escape");
    await page.locator("#dialog-project-title").waitFor({ state: "detached" });
  }
});
await test("Education stays aligned and toolkit names appear in dimensional circles", async () => {
  assert.equal(
    await page
      .locator("#education .neu, #skills .inflate, #skills .neu")
      .count(),
    0,
  );
  assert.equal(await page.locator(".education-entry").count(), 2);
  const starts = await page
    .locator(".education-entry")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
  assert.ok(Math.abs(starts[0] - starts[1]) < 1);
  assert.equal(await page.locator(".tool-group").count(), 7);
  assert.equal(await page.locator(".category-orb").count(), 7);
  assert.equal(await page.locator(".category-orb li").count(), 41);
  assert.equal(await page.locator("h1 .chrome-text").count(), 0);
});
await test("Coursework disclosure works and the cleaned sections render", async () => {
  await page.locator("#education").scrollIntoViewIfNeeded();
  const coursework = page.locator(".education-coursework").first();
  await coursework.locator("summary").click();
  assert.ok(await coursework.evaluate((el) => el.open));
  assert.match(await coursework.textContent(), /AI Capstone/);
  await coursework.locator("summary").click();
  await page.waitForTimeout(700);
  await page
    .locator("#education")
    .screenshot({ path: ".audit/education-clean.png" });
  await page.locator(".tool-group").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  await page.locator(".tool-group").last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  await page.locator("#skills").screenshot({ path: ".audit/skills-clean.png" });
});
await test("Footer experiment has visible and announced feedback", async () => {
  const signal = page.getByRole("button", { name: "Send a signal" });
  await signal.evaluate((el) => el.click());
  assert.equal(await page.locator("html").getAttribute("data-signal"), "true");
  assert.match(
    await page.locator(".signal-experiment [role=status]").textContent(),
    /Signal received/,
  );
});
await test("No desktop JavaScript errors", async () =>
  assert.deepEqual(errors, []));
await desktop.close();
const mobile = await browser.newContext({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
});
const phone = await mobile.newPage();
await phone.goto(BASE, { waitUntil: "networkidle" });
await test("Mobile menu opens, closes on Escape and exposes About", async () => {
  await phone.getByRole("button", { name: "Open navigation" }).click();
  await phone
    .locator('#nav-sections a[href="#about"]')
    .waitFor({ state: "visible" });
  await phone.keyboard.press("Escape");
  assert.equal(
    await phone.locator("#nav-sections").getAttribute("data-open"),
    "false",
  );
});
await mobile.close();
const reduced = await browser.newContext({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
const quiet = await reduced.newPage();
await quiet.goto(BASE, { waitUntil: "networkidle" });
await test("Reduced motion: no Lenis, tilt control, or pinned gallery", async () => {
  assert.equal(
    await quiet
      .locator(".lenis-active,.motion-permission,.project-journey.is-pinned")
      .count(),
    0,
  );
  assert.equal(
    await quiet
      .locator(".intro-copy")
      .evaluate((el) => getComputedStyle(el).opacity),
    "1",
  );
});
await reduced.close();
const largeContext = await browser.newContext({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
});
const large = await largeContext.newPage();
await large.goto(BASE, { waitUntil: "networkidle" });
await large.addStyleTag({
  content: "html{font-size:200%!important;scroll-behavior:auto!important}",
});
await large.waitForTimeout(250);
await test("200% phone text: heading wraps and the introduction grows", async () => {
  assert.equal(
    await large.locator("html").getAttribute("data-large-type"),
    "true",
  );
  assert.equal(
    await large
      .locator(".intro-sticky")
      .evaluate((el) => getComputedStyle(el).position),
    "relative",
  );
  assert.ok(
    await large
      .locator("h1")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  );
  await large.screenshot({ path: ".audit/phone-large-text.png" });
});
await largeContext.close();
await browser.close();
await mkdir(".audit", { recursive: true });
await writeFile(".audit/interactions.json", JSON.stringify(results, null, 2));
if (results.some((r) => !r.pass)) process.exitCode = 1;
