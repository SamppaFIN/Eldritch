import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { cellAt, cellsWithin, regionOf } from '@es3/core/geo';
import { openMap } from './hearth.js';

/**
 * Field report 2026-09-30: *"new game ja silti nään noi punaset maat.. pistä piiloon"*.
 * A rival's ground from the shared world is drawn only where it has been seen — walked
 * beside, sighted from afar or revealed — never on a fresh map.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** A hex four rings out: past the Hearth ring and the ring the fog opens around it. */
const home = cellAt({ lat: HERE.latitude, lng: HERE.longitude });
const inner = new Set(cellsWithin(home, 3));
const FAR = cellsWithin(home, 4).find((h) => !inner.has(h)) as string;

async function put(page: Page, key: string, value: unknown): Promise<void> {
  await page.evaluate(
    ({ key, value }) =>
      new Promise<void>((res, rej) => {
        const req = indexedDB.open('es3');
        req.onsuccess = () => {
          const tx = req.result.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(value, key);
          tx.oncomplete = () => {
            req.result.close();
            res();
          };
          tx.onerror = () => rej(tx.error);
        };
      }),
    { key, value },
  );
}

/** Whether the map's cell source carries this hex. */
const drawn = (page: Page, h3: string) =>
  page.evaluate((h) => {
    const map = (globalThis as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
    return map.querySourceFeatures('cells').some((f) => f.id === h || f.properties?.h3 === h);
  }, h3);

test('a rival’s shared ground stays hidden until it has been seen', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  const rival = {
    h3: FAR, ownerId: 'rival', strength: 200, lastVisitedAt: Date.now(), visitDays: [],
    imported: true, importedFrom: { name: 'Rival', seenAt: Date.now() },
  };
  await put(page, `cell:${regionOf(FAR)}:${FAR}`, rival);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(4_000);
  expect(await drawn(page, FAR)).toBe(false);

  // Sighted from afar — a Watchtower, Dream-Sight — and it is drawn.
  await put(page, 'sighted', { [FAR]: Date.now() });
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => drawn(page, FAR), { timeout: 15_000 }).toBe(true);
});
