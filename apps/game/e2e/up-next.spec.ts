import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-NEXT-001 — the walking sheet says what finishes next, and a tap goes there.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** A Keep in the pouch record, written until it stays (the app rewrites `resources`). */
async function foundKeep(page: Page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const kept = await page.evaluate(() => new Promise<boolean>((resolve) => {
      const open = indexedDB.open('es3');
      open.onsuccess = () => {
        const tx = open.result.transaction('kv', 'readwrite');
        const kv = tx.objectStore('kv');
        const get = kv.get('resources');
        get.onsuccess = () => {
          const cur = get.result ?? { pool: {}, since: Date.now(), sinceDay: Date.now() };
          kv.put({ ...cur, keep: { level: 1, granary: { citizens: 1, box: 0, starvedH: 0 }, titheAt: Date.now() } }, 'resources');
        };
        tx.oncomplete = () => {
          setTimeout(() => {
            const read = open.result.transaction('kv', 'readonly').objectStore('kv').get('resources');
            read.onsuccess = () => { open.result.close(); resolve(Boolean(read.result?.keep)); };
          }, 400);
        };
      };
    }));
    if (kept) return;
  }
  throw new Error('the Keep would not stay seeded');
}

test('the sheet names what finishes next, and a tap goes there', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }
  const strip = page.getByLabel('Up next');
  await expect(strip).toBeVisible({ timeout: 20_000 });
  // The rows are read after boot, and a booting realm is slow here (software GL, IndexedDB).
  await expect(strip).toContainText(/\d+ (min|h|d)|now/, { timeout: 20_000 });
  // A tap goes there: the next citizen is the Keep's business.
  // Two in view, the rest behind "+N" (BRDC-UX-008).
  const rest = strip.getByRole('button', { name: /^\+\d+$/ });
  if (await rest.isVisible().catch(() => false)) await rest.click();
  const citizen = strip.getByRole('button', { name: /^Next citizen/ });
  await expect(citizen).toBeVisible();
  await citizen.click();
  await expect(page.getByLabel('Your sanctuary')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/upnext.png' });
});
