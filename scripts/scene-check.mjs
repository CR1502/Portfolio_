import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto('http://localhost:3210',{waitUntil:'networkidle'});
for(let i=0;i<6;i++){
 await page.locator('#projects').evaluate((el,i)=>window.scrollTo({top:el.offsetTop+innerHeight*.65*i,behavior:'instant'}),i);await page.waitForTimeout(500);
 assert.equal(await page.locator('.project-piece[aria-hidden="false"]').count(),1);
 const active=page.locator('.project-piece[aria-hidden="false"]');assert.equal(await active.evaluate(el=>getComputedStyle(el).opacity),'1');
 assert.equal(await active.evaluate(el=>el.inert),false);
 console.log('✓ scene',i+1,await active.locator('h3').textContent());
}
await page.locator('#projects').evaluate(el=>window.scrollTo({top:el.offsetTop+innerHeight*.65*.48,behavior:'instant'}));await page.waitForTimeout(500);
assert.equal(await page.locator('.project-piece[aria-hidden="false"]').evaluate(el=>getComputedStyle(el).opacity),'1');
const active=page.locator('.project-piece[aria-hidden="false"]'),bounds=await active.boundingBox(),svg=active.locator('svg');
await page.mouse.move(bounds.x+bounds.width*.2,bounds.y+bounds.height*.35);await page.waitForTimeout(180);const a=await svg.evaluate(el=>getComputedStyle(el).transform);
await page.mouse.move(bounds.x+bounds.width*.8,bounds.y+bounds.height*.4);await page.waitForTimeout(180);assert.notEqual(await svg.evaluate(el=>getComputedStyle(el).transform),a);
console.log('✓ stopped between scenes stays readable; project model follows pointer');
await browser.close();
