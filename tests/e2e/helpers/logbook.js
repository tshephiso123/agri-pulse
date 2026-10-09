import { expect } from '@playwright/test';
import { primary, back } from './calculator';
export async function completeOnboarding(page) {
  if (await page.locator('.language-picker').count()) await primary(page).click();
  if (await page.locator('.farm-setup').count()) for(let step=0;step<4;step++) await primary(page).click();
  await expect(page.locator('.tool-nav')).toBeVisible();
}
export async function openRecords(page, url='/') { await page.goto(url);await completeOnboarding(page);await page.locator('.tool-nav button').nth(2).click(); }
export async function openVault(page, passphrase, create=false) {
  await primary(page).click();await page.getByLabel('Encryption passphrase',{exact:true}).fill(passphrase);
  if(create)await page.getByLabel('Confirm new passphrase',{exact:true}).fill(passphrase);
  await primary(page).click();await expect(page.locator('.tool-nav')).toBeVisible();
}
export async function saveEntry(page,activity,notes='',local=true,editing=false) {
  if(!editing)await primary(page).click();await page.getByLabel('Activity',{exact:true}).fill(activity);await primary(page).click();await page.getByLabel('Notes',{exact:true}).fill(notes);await primary(page).click();await page.getByRole('checkbox',{name:'Keep my records on this phone only',exact:true}).setChecked(local);await primary(page).click();await expect(page.locator('h2')).toHaveText('Entry saved');await primary(page).click();await expect(page.locator('.tool-nav')).toBeVisible();await expect(page.locator('article').filter({hasText:activity})).toBeVisible();
}
export async function editEntry(page,activity) { await page.locator('article').filter({hasText:activity}).locator('button').click();await primary(page).click(); }
export async function registerAccount(page,email,passphrase,password) {
  await page.getByRole('button',{name:'Record settings',exact:true}).click();await page.getByRole('button',{name:'Optional cloud account',exact:true}).click();await page.getByRole('button',{name:'Create a cloud account',exact:true}).click();await page.getByLabel('Encryption passphrase',{exact:true}).fill(passphrase);await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Account password (at least 12 characters)',{exact:true}).fill(password);await primary(page).click();await expect(page.getByText('Signed in. Only records you choose to share will upload.',{exact:true})).toBeVisible();await back(page).click();await back(page).click();await back(page).click();await expect(page.locator('.tool-nav')).toBeVisible();
}
export async function pendingStatus(page) { await page.locator('.status-chip').click();await expect(page.getByRole('dialog')).toContainText(/1 pending/);await page.keyboard.press('Escape'); }
