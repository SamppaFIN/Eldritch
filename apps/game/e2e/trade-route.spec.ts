import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
// Subpath imports, not the barrel (see encounter.spec.ts).
import { cellAt, destination, regionOf } from '@es3/core/geo';
import { openMap } from './hearth.js';

/**
 * BRDC-TRADEROUTE-001 — a trade route walked between two of your Markets stands in the
 * Ledger with what it pays, and breaks when an end is lost. (The walk that makes one is
 * unit-tested through the walk writer, on `sim/` walks.)
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const A = cellAt({ lat: HERE.latitude, lng: HERE.longitude });
const B = cellAt(destination({ lat: HERE.latitude, lng: HERE.longitude }, 0, 600));

async function read(page: Page, key: string): Promise<unknown> {
  return page.evaluate((k) => new Promise((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const get = open.result.transaction('kv', 'readonly').objectStore('kv').get(k);
      get.onsuccess = () => { open.result.close(); resolve(get.result); };
    };
  }), key);
}

/** Two Markets of yours 600 m apart, and the route walked between them. */
async function seedRoute(page: Page, owner: string) {
  const cells = [A, B].map((h3) => ({ key: `cell:${regionOf(h3)}:${h3}`, h3 }));
  await page.evaluate(({ cells, owner, a, b }) => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      const kv = tx.objectStore('kv');
      const now = Date.now();
      for (const c of cells) kv.put({ h3: c.h3, ownerId: owner, strength: 300, lastVisitedAt: now, visitDays: [], buildings: [{ id: 'market', builtAt: now }] }, c.key);
      kv.put([{ id: a < b ? `${a}~${b}` : `${b}~${a}`, a, b, lengthM: 600, toVillage: false, at: now }], 'trade-routes');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }), { cells, owner, a: A, b: B });
}

async function routesTab(page: Page) {
  const open = page.getByRole('button', { name: 'Lands', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    return open.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await open.click();
  const lands = page.getByRole('region', { name: 'Your lands' });
  await lands.getByRole('tab', { name: 'Routes' }).click();
  return lands.getByRole('list', { name: 'Trade routes' });
}

test('a route between two of your Markets pays, and breaks when one is lost', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  const me = ((await read(page, 'profile')) as { id: string } | undefined)?.id as string;
  await seedRoute(page, me);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  const list = await routesTab(page);
  await expect(list).toContainText('Market → Market · 0.6 km');
  await expect(list).toContainText('+2.6 gold/h');
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/routes.png' });

  // Lose the far Market: the route stays on the list, broken.
  await page.evaluate((key) => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').delete(key);
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }), `cell:${regionOf(B)}:${B}`);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await expect(await routesTab(page)).toContainText('broken — an end is lost');
});
