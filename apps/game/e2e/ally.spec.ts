import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-ALLY-001 — an ally walks with the investigator; a second one's offer is answered in the Keep.
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

/** The investigator record as a finished pair of tasks leaves it: one ally, one offer. */
async function seedAllies(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ stamina: 7, sanity: 6, clues: 0, skills: { lore: 3, will: 2, fight: 2, observe: 2 }, restedAt: Date.now(), ally: 'cornelius', allyOffer: 'grug' }, 'investigator');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('the Keep shows who walks with you, and a new ally is taken on request', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await seedAllies(page);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.getByRole('tab', { name: 'Investigator' }).click(); // the Keep's tabs (BRDC-UX-004)
  const panel = page.getByLabel('Your sanctuary').getByRole('region', { name: 'Your investigator' });
  await expect(panel).toContainText('Walks with you: Cornelius, the hermit · +1 die on Lore tests', { timeout: 20_000 });
  await expect(panel).toContainText('Grug, of the bridge offers to walk with you instead');
  await panel.getByRole('button', { name: 'Take Grug' }).click();
  await expect(panel).toContainText('Walks with you: Grug, of the bridge · +1 die on Vigor tests');
  await expect(panel.getByRole('group', { name: 'An ally offers' })).toHaveCount(0);
});
