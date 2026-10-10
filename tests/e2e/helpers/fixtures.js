import { test as base, expect } from '@playwright/test';
// Existing regressions start with an established setup; phase4.spec tests real first launch.
export const test = base.extend({ page: async ({ page }, use) => {
  await page.addInitScript(() => { if (!localStorage.getItem('agrismart_farm_setup')) localStorage.setItem('agrismart_farm_setup', JSON.stringify({version:1,name:'',community:'',crops:['maize'],area:''})); });
  await use(page);
} });
export { expect };
