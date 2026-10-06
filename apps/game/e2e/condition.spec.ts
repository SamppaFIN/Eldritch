import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-CONDITION-001 — lasting conditions stand in the Keep, each with how it ends.
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

/** An investigator carrying a Debt and Paranoia, as two failed rumours leave them. */
async function seedConditions(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      const at = Date.now();
      tx.objectStore('kv').put({ stamina: 7, sanity: 6, clues: 0, skills: { lore: 3, will: 2, fight: 2, observe: 2 }, restedAt: at, conditions: [{ id: 'debt', at }, { id: 'paranoia', at }] }, 'investigator');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('the Keep lists conditions with their way out, and a debt cannot be paid without the gold', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await seedConditions(page);
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const list = page.getByLabel('Your sanctuary').getByRole('list', { name: 'Conditions' });
  await expect(list).toContainText('Debt · You owe 50 gold.', { timeout: 20_000 });
  await expect(list).toContainText('Paranoia · Wit tests roll one die fewer. Walk your Hearth hex.');
  // A new realm holds no 50 gold.
  await list.getByRole('button', { name: 'Pay 50 gold' }).click();
  await expect(list).toContainText('Not enough gold yet.');
});
