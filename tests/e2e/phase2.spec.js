import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openCalculator, enterAreaStep, primary, back, assertSafeActions } from './helpers/calculator';
const sizes=[[360,640],[390,844],[768,1024],[1366,768],[360,320],[640,360]];
for(const [width,height] of sizes) for(const mode of ['english','pseudo','large-text']) {
  test(`phase 2 ${width}x${height} ${mode}: calculator completes with reachable actions`,async ({page})=>{
    await page.setViewportSize({width,height});
    await openCalculator(page,mode==='pseudo'?'/?pseudo=1':'/');
    if(mode==='large-text') await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    const snapshot=async name=>{ await assertSafeActions(page); if([360,1366].includes(width)) await page.screenshot({path:`docs/ui/phase2/${width}x${height}-${mode}-${name}.png`}); };
    await expect(page.locator('.tool-nav')).toHaveCount(0);
    await expect(page.locator('#crop-maize')).toBeChecked();
    await snapshot('crop');
    await primary(page).click();
    await expect(page.locator('#fertilizer-urea')).toBeChecked();
    await snapshot('fertilizer');
    await primary(page).click();
    await snapshot('area');
    await page.locator('#area').fill('0');
    await primary(page).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('#area')).toHaveAttribute('aria-invalid','true');
    await snapshot('error');
    await page.locator('#area').fill('2');
    await primary(page).click();
    await expect(page.locator('.estimate-details')).toContainText('2');
    await snapshot('review');
    await primary(page).click();
    await expect(page.getByTestId('calculator-total')).toContainText('435');
    await expect(page.locator('.estimate-details dd')).toHaveText(['9','29','2']);
    await snapshot('result');
    await page.locator('.wizard-content').evaluate(element=>element.scrollTo({top:element.scrollHeight}));
    await snapshot('result-details');
    await back(page).click();
    await expect(page.getByTestId('calculator-total')).toHaveCount(0);
    await back(page).click();
    await expect(page.locator('#area')).toHaveValue('2');
    await page.locator('#area').fill('3');
    await primary(page).click(); await primary(page).click();
    await expect(page.getByTestId('calculator-total')).toContainText('652');
    await primary(page).click();
    await expect(page.locator('#crop-maize')).toBeChecked();
    await assertSafeActions(page);
    await back(page).click();
    await expect(page.locator('.tool-nav')).toBeVisible();
  });
}
test('phase 2 validation, non-default products, keyboard submission and return preserve details',async ({page})=>{
  await openCalculator(page);
  await page.locator('#crop-tomato').check(); await primary(page).click();
  await page.locator('#fertilizer-lan').check(); await primary(page).click();
  for(const invalid of ['', '-2','0.009']) { await page.locator('#area').fill(invalid); await primary(page).click(); await expect(page.getByRole('alert')).toContainText('at least 0.01'); }
  await page.locator('#area').fill('3'); await page.locator('#area').press('Enter');
  await expect(page.locator('.estimate-details')).toContainText('Tomato');
  await expect(page.locator('.estimate-details')).toContainText('LAN (28)');
  await primary(page).click();
  await expect(page.getByTestId('calculator-total')).toHaveText('1,286 kg');
  await expect(page.locator('.estimate-details dd')).toHaveText(['26','86','2']);
  await primary(page).click();
  await expect(page.locator('#crop-tomato')).toBeChecked();
  await primary(page).click(); await expect(page.locator('#fertilizer-lan')).toBeChecked();
  await primary(page).click();
  await page.locator('#area').fill('0.01');await primary(page).click();await primary(page).click();
  await expect(page.getByTestId('calculator-total')).toHaveText('4 kg');
  await expect(page.locator('.estimate-details dd')).toHaveText(['1','1','1']);
  await back(page).click();await back(page).click();
  await page.locator('#area').fill('1e308');await primary(page).click();await primary(page).click();
  await expect(page.getByRole('alert')).toContainText('could not calculate');
  await expect(page.locator('#area')).toHaveValue('1e308');
});
for(const language of ['nso','ve','ts']) {
  const messages=JSON.parse(readFileSync(new URL(`../../src/locales/${language}.json`,import.meta.url),'utf8'));
  test(`phase 2 ${language}: calculator works after cold offline reload with English fallback`,async ({page,context})=>{
    await page.addInitScript(code=>localStorage.setItem('agripulse_lang',code),language);
    await page.goto('/');
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    await context.setOffline(true);await page.reload();
    await page.locator('.tool-nav button').nth(1).click();await primary(page).click();
    await expect(page.locator('input[name="crop"]').first().locator('..')).toContainText(messages.crop_maize);
    await enterAreaStep(page);
    await page.locator('#area').fill('0');await primary(page).click();
    await expect(page.getByRole('alert')).toContainText(messages['Enter a field size of at least 0.01 hectares. For example, enter 2 for two hectares.']);
    await page.locator('#area').fill('2');await primary(page).click();await primary(page).click();
    await expect(page.getByTestId('calculator-total')).toContainText('435');
    await assertSafeActions(page);
    await expect(page.locator('html')).toHaveAttribute('lang',language);
  });
}
