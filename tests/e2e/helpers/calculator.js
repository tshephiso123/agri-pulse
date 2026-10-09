import { expect } from '@playwright/test';
export const primary = page => page.locator('.wizard-actions .ui-primary');
export const back = page => page.locator('.wizard-actions .ui-outline');
export async function openCalculator(page, url = '/') {
  await page.goto(url);
  if (await page.locator('.language-picker').count()) await primary(page).click();
  await page.locator('.tool-nav button').nth(1).click();
  await primary(page).click();
  await expect(page.locator('input[name="crop"]')).toHaveCount(2);
}
export async function enterAreaStep(page) {
  await primary(page).click();
  await expect(page.locator('input[name="fertilizer"]')).toHaveCount(3);
  await primary(page).click();
  await expect(page.locator('#area')).toBeVisible();
}
export async function assertSafeActions(page) {
  await expect.poll(() => page.evaluate(() => {
    const controls = [...document.querySelectorAll('.wizard-actions button')];
    const primaries = document.querySelectorAll('.wizard-actions .ui-primary');
    return primaries.length === 1 && controls.every(control => { const rect=control.getBoundingClientRect(); return rect.top>=0 && rect.bottom<=innerHeight && rect.left>=0 && rect.right<=innerWidth; });
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight<=innerHeight && document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
