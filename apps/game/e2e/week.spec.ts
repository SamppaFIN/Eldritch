import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-AGE-001 — a golden week names itself on the sheet, and its boon is taken once in the Keep.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** This week, already judged golden. */
async function goldenWeek(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const d = new Date();
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7))).toISOString().slice(0, 10);
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ week: monday, kind: 'golden', marks: {} }, 'week');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('a golden week is named on the sheet, and its boon is taken once', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  // Reload only once the Keep is saved, or the reloaded sheet has no Keep to go to.
  await expect.poll(() => page.evaluate(() => new Promise<boolean>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const get = open.result.transaction('kv', 'readonly').objectStore('kv').get('castle');
      get.onsuccess = () => { open.result.close(); resolve(get.result !== undefined); };
    };
  })), { timeout: 20_000 }).toBe(true);
  await goldenWeek(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }

  const named = page.getByLabel('Up next').getByRole('button', { name: 'A golden week' });
  await expect(named).toBeVisible({ timeout: 20_000 });
  await named.click();
  const week = page.getByLabel('Your sanctuary').getByRole('region', { name: 'This week' });
  await week.getByRole('button', { name: 'Long Harvest · +3 food/h' }).click();
  await week.getByRole('button', { name: 'Take Long Harvest for the week' }).click();
  await expect(week).toContainText('The week’s boon · Long Harvest');
  await expect(week.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/week.png' });
});
