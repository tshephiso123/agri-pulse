import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
// Windows may temporarily lock a recently overwritten image for scanning.
// Retry only filesystem writes; screenshot capture and layout assertions still fail normally.
export async function screenshot(page, options) {
 const { path, ...capture } = options;
 const bytes = await page.screenshot(capture);
 await mkdir(dirname(path), { recursive: true });
 for (let attempt = 0; ; attempt++) {
  try { await writeFile(path, bytes); return; }
  catch (error) { if (attempt >= 4 || !['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(error.code)) throw error; await new Promise(resolve => setTimeout(resolve, 250)); }
 }
}
