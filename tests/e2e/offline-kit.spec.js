import {test,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
test('shared field kit runs from a local file without a network',async({page,context})=>{
 await context.setOffline(true);const requests=[];page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(pathToFileURL(resolve('dist/agripulse-offline.html')).href);
 await page.locator('#calculate').click();await expect(page.locator('#result')).toContainText('217.391 kg');
 await page.getByRole('button',{name:/Ragged holes/}).click();await page.getByRole('button',{name:'Yes',exact:true}).click();
 await expect(page.locator('#tree')).toContainText('Possible leaf-feeding caterpillar');await expect(page.locator('#soil')).toContainText('jar observation');
 expect(requests).toEqual([]);
});
