import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const sizes = [[360,640], [390,844], [768,1024], [1366,768], [360,320], [640,360]];
async function safePrimary(page) {
  await expect.poll(() => page.evaluate(() => {
    const controls = [...document.querySelectorAll('.wizard-actions .ui-primary')];
    return controls.length > 0 && controls.every(control => { const box = control.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth; });
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
}
for (const [width,height] of sizes) for (const mode of ['english','pseudo','large-text']) {
  test(`phase 1 ${width}x${height} ${mode}: language and tool homes keep primary actions reachable`, async ({ page }) => {
    mkdirSync('docs/ui/phase1', { recursive: true });
    await page.setViewportSize({width,height});
    await page.goto(mode === 'pseudo' ? '/?pseudo=1' : '/');
    if (mode === 'large-text') await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await expect(page.getByRole('radio')).toHaveCount(4);
    for (const name of ['English','Sepedi','Tshivenda','itsonga']) await expect(page.getByRole('radio', { name: name === 'itsonga' ? 'itsonga' : name, exact: true })).toHaveCount(name === 'itsonga' ? 0 : 1);
    await safePrimary(page);
    if (mode === 'english' || width === 360) await page.screenshot({ path: `docs/ui/phase1/${width}x${height}-${mode}-language.png` });
    await page.locator('.wizard-actions .ui-primary').click();
    await expect(page.locator('.tool-nav')).toBeVisible();
    for (let index=0;index<3;index++) {
      await page.locator('.tool-nav button').nth(index).click();
      await safePrimary(page);
      if ([360,1366].includes(width)) await page.screenshot({ path: `docs/ui/phase1/${width}x${height}-${mode}-home-${index}.png` });
    }
    await page.locator('.tool-nav button').nth(0).click();
    await page.locator('.wizard-actions .ui-primary').click();
    await expect(page.locator('.tool-nav')).toHaveCount(0);
    await safePrimary(page);
    if ([360,1366].includes(width)) await page.screenshot({ path: `docs/ui/phase1/${width}x${height}-${mode}-wizard-frame.png` });
    await page.locator('.wizard-actions .ui-outline').click();
    await expect(page.locator('.tool-nav')).toBeVisible();
  });
}
test('phase 1 offline reload retains language, local font and status dialog keyboard behavior', async ({page, context}) => {
  await page.goto('/');
  await page.getByRole('radio', {name:'Tshivenda', exact:true}).check();
  await page.locator('.wizard-actions .ui-primary').click();
  await expect(page.locator('header select')).toHaveValue('ve');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})); await document.fonts.ready; });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('header select')).toHaveValue('ve');
  await expect(page.locator('.tool-nav')).toBeVisible();
  await page.locator('.status-chip').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({path:'docs/ui/phase1/offline-status.png'});
  await page.keyboard.press('Escape');
  await expect(page.locator('.status-chip')).toBeFocused();
  const client=await context.newCDPSession(page);
  await client.send('DOM.enable'); await client.send('CSS.enable');
  await page.evaluate(async () => { const el=document.createElement('p'); el.id='glyph-probe'; el.textContent='ḓ ḽ ṅ ṋ ṱ Ḓ Ḽ Ṅ Ṋ Ṱ'; document.querySelector('.wizard-content').prepend(el); await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  const {root}=await client.send('DOM.getDocument');
  const {nodeId}=await client.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#glyph-probe'});
  const {fonts}=await client.send('CSS.getPlatformFontsForNode',{nodeId});
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every(font=>font.isCustomFont && font.familyName==='Noto Sans')).toBe(true);
  await page.screenshot({path:'docs/ui/phase1/tshivenda-glyphs.png'});
});

