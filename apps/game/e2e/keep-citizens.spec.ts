import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-PROG-001 — The Keep · Citizens. A Season 1 save has no Keep record and sees no
 * change; a Season 2 save (one with `keep` in the pouch record) sees its citizens, the
 * granary and the Raise button.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** Give the pouch record a Keep, the way SEASON-006 will on the first day of a season. */
async function foundKeep(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('es3');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('kv', 'readwrite');
          const kv = tx.objectStore('kv');
          const get = kv.get('resources');
          get.onsuccess = () => {
            const cur = get.result ?? { pool: {}, since: Date.now(), sinceDay: Date.now() };
            kv.put({ ...cur, keep: { level: 1, granary: { citizens: 1, box: 0, starvedH: 0 } } }, 'resources');
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}

test('a Season 1 save shows no Citizens section', async ({ page }) => {
  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const keep = page.getByLabel('Your sanctuary');
  await expect(keep.getByLabel('Grow the Hearth')).toBeVisible();
  await expect(keep.getByLabel('Citizens')).toHaveCount(0);
});

test('a Season 2 save shows its citizens, granary and the Raise button', async ({ page }) => {
  await openMap(page, HERE);
  await foundKeep(page);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();

  const citizens = page.getByLabel('Your sanctuary').getByLabel('Citizens');
  await expect(citizens).toContainText('1 / 6 housed · Keep level 1');
  await expect(citizens).toContainText('Granary 0 / 29');
  await expect(citizens.getByRole('button', { name: /Raise the Keep · 100 food · 50 stone/ })).toBeVisible();
});
