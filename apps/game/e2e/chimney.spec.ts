import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
// Subpath imports, not the barrel (see encounter.spec.ts).
import { regionOf } from '@es3/core/geo';
import { CHIMNEYS } from '@es3/core/rules';
import { openMap } from './hearth.js';

/**
 * BRDC-CHIMNEY-001 — hold all three chimneys and they light: the fog lifts about a
 * kilometre around them, once, and their marks say so.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** The three chimney hexes as your own ground, owned by the profile's own id. */
async function holdChimneys(page: Page, owner: string) {
  const cells = CHIMNEYS.map((c) => ({ key: `cell:${regionOf(c.h3)}:${c.h3}`, h3: c.h3 }));
  await page.evaluate(({ cells, owner }) => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      const now = Date.now();
      for (const c of cells) tx.objectStore('kv').put({ h3: c.h3, ownerId: owner, strength: 100, lastVisitedAt: now, visitDays: [] }, c.key);
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }), { cells, owner });
}

async function read(page: Page, key: string): Promise<unknown> {
  return page.evaluate((k) => new Promise((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const get = open.result.transaction('kv', 'readonly').objectStore('kv').get(k);
      get.onsuccess = () => { open.result.close(); resolve(get.result); };
    };
  }), key);
}

test('three chimneys held light the district', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  const me = ((await read(page, 'profile')) as { id: string } | undefined)?.id;
  expect(me).toBeTruthy();
  await holdChimneys(page, me as string);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  await expect.poll(async () => (await read(page, 'chimneys')) as { litAt?: number } | undefined, { timeout: 90_000 }).toMatchObject({ litAt: expect.any(Number) });
  const sighted = (await read(page, 'sighted')) as Record<string, number>;
  expect(Object.keys(sighted).length).toBeGreaterThan(1_500);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/chimney.png' });
});
