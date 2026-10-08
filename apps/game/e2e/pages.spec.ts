import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-PAGES-001 — a found page of the Book is read in the Keep, once, at a price.
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

/** The Book's first page, found on a rumour. */
async function pageFound(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ found: ['p1'], read: [] }, 'pages');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('a page of the Book is read once, and sanity holds one less', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await pageFound(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const keep = page.getByRole('button', { name: 'Keep', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    return keep.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await keep.click();

  const book = page.getByLabel('Your sanctuary').getByRole('region', { name: 'The Book' });
  await expect(book).toContainText('1 of 10 pages found · sanity holds at most 6', { timeout: 15_000 });
  await book.getByRole('button', { name: 'Read · Salt Circle' }).click();
  await book.getByRole('button', { name: 'Read it — sanity holds one less, for good' }).click();
  await expect(book).toContainText('✦ Read.');
  await expect(book).toContainText('sanity holds at most 5');
  await expect(book.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/pages.png' });
});
