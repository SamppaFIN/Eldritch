import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-ADJ-001 — a Work beside another of its kind makes one more, and the hex card says so.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** A Sawmill on the Hearth hex and on one more of its own ring (all of it borders the Hearth). */
async function twoSawmills(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const db = open.result;
      const read = db.transaction('kv', 'readonly').objectStore('kv');
      const home = read.get('home');
      const all: { key: string; value: { ownerId: string } }[] = [];
      const cursor = read.openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (c) {
          if (String(c.key).startsWith('cell:')) all.push({ key: String(c.key), value: c.value });
          c.continue();
          return;
        }
        const mine = all.find((x) => x.key.endsWith(`:${home.result}`));
        const other = all.find((x) => x !== mine && x.value.ownerId === mine?.value.ownerId);
        const tx = db.transaction('kv', 'readwrite');
        const kv = tx.objectStore('kv');
        for (const x of [mine, other]) if (x) kv.put({ ...x.value, buildings: [{ id: 'sawmill', builtAt: Date.now() }] }, x.key);
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    };
  }));
}

test('two Sawmills side by side: the card names the neighbour', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await twoSawmills(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }
  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toContainText(/beside 1 of its kind/i, { timeout: 20_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/adjacency.png' });
});
