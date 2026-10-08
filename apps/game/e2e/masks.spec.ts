import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-MASKS-001 — three of the stranger's masks met: the Keep lets you name him; a wrong
 * name costs, the true one opens a choice.
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

/** Three masks met on rumours. */
async function threeMasks(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ met: ['forest:mask-woodcutter', 'lake:mask-fisherman', 'settlement:mask-pilot'], wrong: 0 }, 'masks');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('the stranger is named after three masks, and dealt with once', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await threeMasks(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const keep = page.getByRole('button', { name: 'Keep', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    return keep.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await keep.click();

  const stranger = page.getByLabel('Your sanctuary').getByRole('region', { name: 'The stranger' });
  await expect(stranger).toContainText('Masks met: the woodcutter, the fisherman, the pilot.', { timeout: 15_000 });
  await stranger.getByRole('button', { name: 'The Ferryman of the Fuming Lake' }).click();
  await stranger.getByRole('button', { name: 'Say it: The Ferryman of the Fuming Lake' }).click();
  await expect(stranger.getByRole('status')).toContainText('That is not his name.');
  await stranger.getByRole('button', { name: 'Nyarlathotep, the Crawling Chaos' }).click();
  await stranger.getByRole('button', { name: 'Say it: Nyarlathotep, the Crawling Chaos' }).click();
  await stranger.getByRole('button', { name: 'Banish him' }).click();
  await stranger.getByRole('button', { name: 'Banish him — for good' }).click();
  await expect(stranger).toContainText('✦ Named, and banished.');
  await expect(stranger.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/masks.png' });
});
