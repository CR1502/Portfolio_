import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { DEVICES, LIMITS } from './viewports.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3210';
const OUT = process.env.OUT_DIR ?? '.audit';
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const SHOTS = !process.argv.includes('--no-shots');

/** Runs in the page. Measures what CSS inspection cannot: real computed values. */
function probe(limits) {
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') return false;
    if (parseFloat(s.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const label = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  // 1. Horizontal overflow, and the elements responsible for it.
  const docW = document.documentElement.clientWidth;
  const overflow = {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: docW,
    overflows: document.documentElement.scrollWidth > docW + 1,
    culprits: [],
  };
  if (overflow.overflows) {
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 || r.left < -1) {
        const s = getComputedStyle(el);
        if (s.position === 'fixed' && r.width <= docW) continue;
        overflow.culprits.push({
          sel: label(el),
          left: Math.round(r.left),
          right: Math.round(r.right),
          over: Math.round(r.right - docW),
        });
      }
    }
    overflow.culprits = overflow.culprits
      .sort((a, b) => b.over - a.over)
      .slice(0, 12);
  }

  // 2. Type below the platform minimum, measured from computed style.
  const small = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const hasOwnText = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
    );
    if (!hasOwnText || !visible(el)) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < limits.minFontPx) {
      const key = `${label(el)} @ ${px.toFixed(2)}px`;
      const cur = small.get(key) ?? { sel: label(el), px: +px.toFixed(2), count: 0, sample: '' };
      cur.count++;
      if (!cur.sample) cur.sample = el.textContent.trim().slice(0, 40);
      small.set(key, cur);
    }
  }

  // 3. Hit targets below the platform minimum.
  const min = matchMedia('(pointer: coarse)').matches
    ? limits.minTargetTouchPx
    : limits.minTargetPointerPx;
  const targets = [];
  for (const el of document.querySelectorAll(
    'a[href], button, summary, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
  )) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < min - 0.5 || r.height < min - 0.5) {
      targets.push({
        sel: label(el),
        w: Math.round(r.width),
        h: Math.round(r.height),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 32),
      });
    }
  }

  // 4. Elements that are invisible but still hit-testable (phantom targets).
  const phantoms = [];
  for (const el of document.querySelectorAll('a[href], button, summary, [role="button"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > innerHeight) continue;
    let o = 1, node = el;
    while (node && node !== document.documentElement) {
      o *= parseFloat(getComputedStyle(node).opacity);
      node = node.parentElement;
    }
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.pointerEvents === 'none') continue;
    if (el.closest('[inert]')) continue;
    if (o < 0.05) {
      phantoms.push({
        sel: label(el),
        opacity: +o.toFixed(3),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 32),
      });
    }
  }

  const fontOf = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { family: s.fontFamily.split(',')[0].replace(/["']/g, ''), weight: s.fontWeight, px: s.fontSize };
  };
  const fonts = {
    body: fontOf('body'),
    h1: fontOf('h1'),
    h2: fontOf('#projects-title'),
    em: fontOf('h1 em'),
    bullet: fontOf('.experience-body li'),
    eyebrow: fontOf('.eyebrow'),
  };

  return { overflow, small: [...small.values()].sort((a, b) => a.px - b.px), targets, phantoms, fonts };
}

/** Phantom + overflow checks at one scroll offset. Scroll-driven fades are
  * fully opaque at the top of the page, so position 0 alone proves nothing. */
function probeAtScroll() {
  const label = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };
  const phantoms = [];
  for (const el of document.querySelectorAll('a[href], button, summary, [role="button"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > innerHeight) continue;
    let o = 1, node = el;
    while (node && node !== document.documentElement) {
      o *= parseFloat(getComputedStyle(node).opacity);
      node = node.parentElement;
    }
    const cs = getComputedStyle(el);
    // visibility:hidden and inert both genuinely remove an element from hit
    // testing and the a11y tree, so they are correct answers, not defects.
    if (cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
    if (el.closest('[inert]')) continue;
    if (o < 0.05) {
      // Confirm it really is the hit-test winner at its own centre.
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      phantoms.push({
        sel: label(el),
        opacity: +o.toFixed(4),
        scrollY: Math.round(scrollY),
        hitTestable: !!(hit && (hit === el || el.contains(hit))),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 32),
      });
    }
  }
  const docW = document.documentElement.clientWidth;
  return {
    phantoms,
    overflows: document.documentElement.scrollWidth > docW + 1,
    scrollY: Math.round(scrollY),
  };
}

const browser = await chromium.launch();
const devices = ONLY.length
  ? DEVICES.filter((d) => ONLY.some((o) => d.name.includes(o)))
  : DEVICES;

await mkdir(OUT, { recursive: true });
const report = [];

for (const d of devices) {
  const ctx = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: d.dpr,
    hasTouch: !!d.touch,
    isMobile: !!d.touch,
    reducedMotion: process.env.REDUCED === '1' ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160)));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Programmatic scrolling must be instant or the sweep samples mid-animation.
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  if (process.env.ZOOM) {
    await page.addStyleTag({ content: `html{font-size:${process.env.ZOOM}%!important}` });
  }
  await page.waitForTimeout(400);

  const res = await page.evaluate(probe, LIMITS);

  // Sweep the page: 5% steps catch scroll-driven fades and pinned sections.
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const sweep = [];
  for (let f = 0; f <= 1.0001; f += 0.05) {
    await page.evaluate((y) => scrollTo(0, y), Math.round(height * f));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(80);
    sweep.push(await page.evaluate(probeAtScroll));
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(150);
  res.sweep = {
    phantoms: sweep.flatMap((s) => s.phantoms),
    overflowAt: sweep.filter((s) => s.overflows).map((s) => s.scrollY),
  };
  res.phantoms = res.sweep.phantoms;
  if (res.sweep.overflowAt.length) res.overflow.overflows = true;

  res.device = d;
  res.errors = errors;
  report.push(res);

  if (SHOTS) {
    await page.screenshot({ path: `${OUT}/${d.name}.png`, fullPage: false });
  }

  const flags = [
    res.overflow.overflows ? `OVERFLOW +${res.overflow.culprits[0]?.over ?? '?'}px` : '',
    res.small.length ? `${res.small.length} tiny-type` : '',
    res.targets.length ? `${res.targets.length} small-target` : '',
    res.phantoms.length ? `${res.phantoms.length} PHANTOM` : '',
    errors.length ? `${errors.length} js-error` : '',
  ].filter(Boolean);
  const pad = d.name.padEnd(24);
  console.log(`  ${flags.length ? '✗' : '✓'} ${pad} ${d.w}×${d.h}@${d.dpr}  ${flags.join('  ') || 'clean'}`);

  await ctx.close();
}

await browser.close();
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(`\nreport: ${OUT}/report.json${SHOTS ? `  ·  screenshots: ${OUT}/*.png` : ''}`);

const bad = report.filter(
  (r) => r.overflow.overflows || r.small.length || r.targets.length || r.phantoms.length || r.errors.length,
);
console.log(`${report.length - bad.length}/${report.length} viewports clean`);

if (bad.length) process.exitCode = 1;
