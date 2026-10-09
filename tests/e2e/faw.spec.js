import { test, expect } from './helpers/fixtures';
import { readFileSync } from 'node:fs';
import { primary, back, assertSafeActions } from './helpers/calculator';
import { completeOnboarding } from './helpers/logbook';
const nso=JSON.parse(readFileSync(new URL('../../src/locales/nso.json',import.meta.url),'utf8'));
async function start(page){await primary(page).click();await primary(page).click();await primary(page).click();}
test('FAW opens through crop choice, handles uncertainty, clears stale advice and resets',async({page})=>{
 await page.goto('/');await completeOnboarding(page);await expect(page.locator('.tool-nav button').first()).toHaveText('Crop check');await start(page);await primary(page).click();await expect(page.getByRole('alert')).toContainText('Choose an answer');for(let i=0;i<3;i++){await page.locator('input[value="no"]').check();await primary(page).click();}await expect(page.locator('h2')).toHaveText('No signs reported — keep checking');await expect(page.locator('.guidance-list')).toContainText('Revisit the field');await back(page).click();await page.locator('input[value="unsure"]').check();await primary(page).click();await expect(page.locator('h2')).toHaveText('Uncertain — inspect again with an adviser');await primary(page).click();for(let i=0;i<5;i++)await primary(page).click();await expect(page.locator('input:checked')).toHaveCount(0);
});
test('Sepedi FAW library and immediate guidance work after cold offline reload',async({page,context})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/');await completeOnboarding(page);await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});await page.locator('header select').selectOption('nso');await context.setOffline(true);await page.reload();await start(page);for(let i=0;i<3;i++){await page.locator('input[value="yes"]').check();await primary(page).click();}await expect(page.locator('h2')).toHaveText(nso.faw_possible);await expect(page.locator('.guidance-list')).toContainText(nso.faw_remove);await expect(page.locator('.guidance-list')).toContainText(nso.faw_chemical);await assertSafeActions(page);await page.screenshot({path:'docs/ui/phase4/faw-sepedi-offline.png'});
});
