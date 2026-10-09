import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const language of ['nso', 'ts', 've']) {
  const messages = JSON.parse(readFileSync(new URL(`../../src/locales/${language}.json`, import.meta.url), 'utf8'));
  test(`${language} switches the full interface offline and survives reopening`, async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const translationRequests = [];
    page.on('request', request => { if (/translate\.google|translation\.googleapis|api\.cognitive/.test(request.url())) translationRequests.push(request.url()); });
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    });
    await context.setOffline(true);
    await page.locator('header select').selectOption(language);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.getByRole('button', { name: messages.nav_calculator, exact: true }).click();
    await expect(page.getByRole('heading', { name: messages.nav_calculator, exact: true })).toBeVisible();
    await expect(page.getByText(messages['Your estimate will appear here'], { exact: true })).toBeVisible();
    await expect(page.locator('#crop option[value="maize"]')).toHaveText(messages.crop_maize);
    await page.locator('#area').fill('0');
    await page.getByRole('button', { name: messages.calc_button, exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(messages['Enter a field size of at least 0.01 hectares. For example, enter 2 for two hectares.']);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.getByRole('button', { name: messages.nav_logbook, exact: true }).click();
    await expect(page.getByText(messages['Protect your logbook'], { exact: true })).toBeVisible();
    await expect(page.getByText(messages['Your records are protected'], { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(translationRequests).toEqual([]);
    await page.screenshot({ path: `test-results/language-${language}.png`, fullPage: true });
  });
}

test('a legacy Sepedi preference is migrated rather than interpreted as Northern Sami', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('agripulse_lang', 'se'));
  await page.reload();
  await expect(page.locator('header select')).toHaveValue('nso');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nso');
});
