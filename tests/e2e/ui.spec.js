import { test, expect } from './helpers/fixtures';
import { openRecords, openVault, saveEntry } from './helpers/logbook';
import { openCalculator, enterAreaStep, primary, back } from './helpers/calculator';

test('calculator explains invalid input and clears stale results', async ({ page }) => {
  await openCalculator(page);
  await enterAreaStep(page);
  await page.locator('#area').fill('0');
  await primary(page).click();
  await expect(page.getByRole('alert')).toContainText('at least 0.01 hectares');
  await page.locator('#area').fill('2');
  await primary(page).click(); await primary(page).click();
  await expect(page.getByTestId('calculator-total')).toHaveText('435 kg');
  await back(page).click(); await back(page).click();
  await page.locator('#area').fill('3');
  await expect(page.getByTestId('calculator-total')).toHaveCount(0);
  await primary(page).click(); await primary(page).click();
  await expect(page.getByTestId('calculator-total')).toHaveText('652 kg');
});

test('phone layout fits and delete dialog returns focus on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/ui-phone.png', fullPage: true });
  await openRecords(page);await openVault(page,'fictional farm passphrase',true);await expect(page.getByText('No entries yet.')).toBeVisible();await saveEntry(page,'Fictional planting');await page.locator('article button').click();
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete entry', exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/ui-logbook-phone.png', fullPage: true });
});
