import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch(),
  results = [];
const BASE = "http://localhost:3210";
async function test(name, run) {
  try {
    await run();
    results.push({ name, pass: true });
    console.log("✓", name);
  } catch (error) {
    results.push({ name, pass: false, error: String(error) });
    console.log("✗", name, String(error));
  }
}
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
await test("One supplied liquid background replaces Soffit and legacy visuals",async()=>{
 assert.equal(await page.locator('.webgl-liquid canvas').count(),1);
 assert.equal(await page.locator('canvas').count(),2);
 assert.equal(await page.locator('.point-cloud-brain canvas').count(),1);
 assert.equal(await page.locator('video,.soffit-background,.pixel-canvas,.hero-orb,.cinematic-frame,.cursor-indicator').count(),0);
 await page.locator('.webgl-liquid[data-ready="true"]').waitFor({timeout:15000});
});
await test("All content sections remain in the intended order", async () =>
  assert.deepEqual(
    await page
      .locator("main > section[id]")
      .evaluateAll((els) => els.map((el) => el.id)),
    [
      "home",
      "about",
      "experience",
      "projects",
      "education",
      "skills",
      "connect",
    ],
  ));
await test("Hero quote, factual copy and editorial About remain",async()=>{
 assert.match(await page.locator('#hero-title').textContent(),/Intelligence,/);
 assert.equal(await page.locator('.hero-identity strong').textContent(),'Craig Lionel Roberts');
 assert.equal(await page.locator('.hero-identity > span').textContent(),'AI Engineer');
 assert.match(await page.locator('#hero-title').textContent(),/engineered/);
 assert.match(await page.locator('#hero-title').textContent(),/for the real world/);
 assert.equal(await page.locator('.about-editorial .about-copy p').count(),3);
 assert.equal(await page.locator('.hero-soffit').count(),1);
});
const FEATURED=4;
// Indices follow DOM order: the sticky sequence first, then the static posters.
async function visitProject(page,index) {
 if (index>=FEATURED) {
   await page.locator('.project-poster').nth(index-FEATURED).evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForTimeout(150);
   return;
 }
 await page.locator('.sticky-project-stack').evaluate((host,index)=>{
   const steps=[...host.querySelectorAll('.sticky-project-step')];
   const y=host.getBoundingClientRect().top+scrollY+steps.slice(0,index).reduce((sum,el)=>sum+el.getBoundingClientRect().height,0);
   scrollTo({top:y,behavior:'instant'});
 },index);
 await page.waitForTimeout(250);
}
await test("Latest four projects pin and shrink; the other eight are static posters",async()=>{
 assert.equal(await page.locator('.sticky-project-step').count(),FEATURED);
 assert.equal(await page.locator('.project-poster').count(),8);
 assert.deepEqual(await page.locator('.sticky-project-step h3').allTextContents(),['SpectraDrift','KubeServe','AEO Content Engine','AdaptAd']);
 const poster=await page.locator('.project-poster').first().evaluate(el=>({position:getComputedStyle(el).position,transform:getComputedStyle(el).transform,sticky:!!el.closest('.sticky-project-step')}));
 assert.deepEqual(poster,{position:'relative',transform:'none',sticky:false});
 await visitProject(page,0);
 const top=await page.locator('.sticky-project-step').first().evaluate(el=>el.getBoundingClientRect().top);
 await page.evaluate(()=>scrollBy({top:innerHeight*.7,behavior:'instant'}));
 await page.waitForTimeout(200);
 const current=await page.locator('.sticky-project-step').first().evaluate(el=>({top:el.getBoundingClientRect().top,position:getComputedStyle(el).position,scale:parseFloat(el.style.getPropertyValue('--stack-scale'))}));
 assert.equal(current.position,'sticky');
 assert.ok(Math.abs(current.top-top)<2);
 assert.ok(current.scale<1);
});
await test("All twelve cards expose correct notes, with local glass and focus handling", async () => {
  const titles = await page.locator(".orbit-card h3").allTextContents();
  for (const title of titles) {
    await visitProject(page,titles.indexOf(title));
    const trigger=page.locator('.project-open').nth(titles.indexOf(title));
    await trigger.click();
    const modal = page.locator("dialog[open]");
    await modal.waitFor();
    assert.equal(
      await page.locator("#dialog-project-title").textContent(),
      title,
    );
    if (title === "KubeServe")
      assert.match(await modal.textContent(), /CPU-only, single-node/);
    assert.equal(
      await modal.evaluate(
        (el) => getComputedStyle(el, "::backdrop").backdropFilter,
      ),
      "none",
    );
    await page.keyboard.press("Shift+Tab");
    assert.ok(
      await modal.evaluate((el) => el.contains(document.activeElement)),
    );
    await page.keyboard.press("Escape");
    await page.locator("#dialog-project-title").waitFor({ state: "detached" });
    assert.ok(await trigger.evaluate((el) => el === document.activeElement));
  }
});
await test("Experience groups, skill categories, and private contact forms remain intact", async () => {
  assert.equal(await page.locator(".experience-category").count(), 2);
  assert.equal(await page.locator(".skill-detail").count(), 7);
  assert.equal(await page.locator(".skill-detail li").count(), 41);
  assert.equal(
    await page.locator('a[href^="mailto:"],a[href^="tel:"]').count(),
    0,
  );
  await page
    .getByRole("button", { name: "Request a call", exact: true })
    .evaluate((el) => el.click());
  assert.equal(await page.locator('input[name="phone"]').count(), 1);
});
await test("Right-edge dock replaces the old nav, stays centred, and magnifies", async () => {
  assert.equal(await page.locator(".nav-toggle, .nav-contact, .hero-actions").count(), 0);
  assert.equal(await page.locator(".nav-wrap .brand").count(), 1);
  assert.deepEqual(
    await page.locator(".dock-item").evaluateAll((els) => els.map((el) => el.getAttribute("href"))),
    ["#home", "#experience", "#projects", "#education", "#skills", "#connect", "/Craig_Roberts_Resume.pdf"],
  );
  assert.equal(await page.locator('.dock-item[href$=".pdf"]').getAttribute("target"), "_blank");
  for (const y of [0, 4000, 9000]) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(150);
    const box = await page.locator(".dock").boundingBox();
    assert.ok(Math.abs(box.y + box.height / 2 - 500) < 2, `dock centre at scroll ${y}`);
    assert.ok(1440 - (box.x + box.width) < 24);
  }
  await page.locator("#projects").evaluate((el) => scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "instant" }));
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.dock-item[aria-current="location"]').getAttribute("href"), "#projects");
  const tile = page.locator('.dock-item[href="#education"]');
  const before = (await tile.boundingBox()).width;
  await tile.hover();
  await page.waitForTimeout(600);
  assert.ok((await tile.boundingBox()).width > before * 1.4);
  assert.equal(await tile.locator(".dock-tip").evaluate((el) => getComputedStyle(el).opacity), "1");
  await page.mouse.move(400, 500);
  await page.waitForTimeout(800);
  assert.ok(Math.abs((await tile.boundingBox()).width - before) < 1);
});
await test("No page JavaScript errors", async () =>
  assert.deepEqual(errors, []));
await page.close();
const phone = await browser.newPage({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
});
await phone.goto(BASE, { waitUntil: "networkidle" });
await test("Phone reaches the final sticky card and the final poster, and opens their notes",async()=>{
 for (const [index,title] of [[FEATURED-1,'AdaptAd'],[11,'SmartSprout']]) {
   await visitProject(phone,index);
   await phone.locator('.project-open').nth(index).click();
   assert.equal(await phone.locator('#dialog-project-title').textContent(),title);
   await phone.keyboard.press('Escape');
   await phone.locator('#dialog-project-title').waitFor({state:'detached'});
 }
});
await test("Phone dock sits centred along the bottom and navigates", async () => {
  const dock = await phone.locator(".dock").boundingBox();
  const vp = phone.viewportSize();
  assert.ok(Math.abs(dock.x + dock.width / 2 - vp.width / 2) < 2);
  assert.ok(dock.x >= 0 && dock.x + dock.width <= vp.width);
  assert.ok(vp.height - (dock.y + dock.height) < 40);
  await phone.locator('.dock-item[href="#experience"]').tap();
  await phone.waitForTimeout(900);
  assert.ok(Math.abs(await phone.locator("#experience").evaluate((el) => el.getBoundingClientRect().top)) < 120);
});
await phone.close();
const reduced = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
});
await reduced.goto(BASE, { waitUntil: "networkidle" });
await test("Reduced motion shows a static field and untransformed project list",async()=>{
 assert.equal(await reduced.locator('.webgl-liquid canvas').evaluate(el=>getComputedStyle(el).display),'none');
 assert.equal(await reduced.locator('video,.pixel-canvas').count(),0);
 const style=await reduced.locator('.sticky-project-card').first().evaluate(el=>({transform:getComputedStyle(el).transform,position:getComputedStyle(el.parentElement).position}));
 assert.deepEqual(style,{transform:'none',position:'relative'});
});
await reduced.close();
await browser.close();
await mkdir(".audit", { recursive: true });
await writeFile(
  ".audit/reference-check.json",
  JSON.stringify(results, null, 2),
);
if (results.some((r) => !r.pass)) process.exitCode = 1;
