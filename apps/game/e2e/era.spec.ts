import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-ERA-001 — entering a new Age, the realm chooses who it became, once.
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

/** Age I's three Lore learned: the realm stands in Age II. */
async function enterAgeTwo(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(['husbandry', 'woodcraft', 'kindling'], 'lore');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('a new Age asks who the realm became, twice, and then only says it', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await enterAgeTwo(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  const card = page.getByRole('button', { name: /^Eureka · .* — dismiss$/ });
  for (let i = 0; i < 6; i += 1) {
    if (await card.first().isVisible().catch(() => false)) await card.first().click();
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }

  await page.getByRole('button', { name: 'Research', exact: true }).click();
  const ages = page.getByRole('dialog', { name: 'The Lore' }).getByRole('region', { name: 'Who the realm became' });
  await expect(ages).toContainText('A new Age.', { timeout: 10_000 });
  await ages.getByRole('radio', { name: 'Merchants · +2 gold/h' }).check(); // a pick, then the button (BRDC-UX-007)
  await ages.getByRole('button', { name: 'Become Merchants — for good' }).click();
  await expect(ages).toContainText('Ages · Merchants');
  await expect(ages.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/era.png' });
});
