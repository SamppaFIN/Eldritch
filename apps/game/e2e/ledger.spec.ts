import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-LEDGER-001…004 — Your lands lists every collection on one shared list: hexes,
 * Works, temples, anomalies; filter chips with counts, a sort, and a row that opens its hex.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function clear(page: Page) {
  for (let i = 0; i < 3; i += 1) {
    const notNow = page.getByRole('button', { name: 'Not now' }).first();
    if (!(await notNow.isVisible().catch(() => false))) return;
    await notNow.click();
  }
}

/** A Farm on the Hearth hex, as building one would leave it. */
async function farmOnHearth(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      const kv = tx.objectStore('kv');
      const home = kv.get('home');
      home.onsuccess = () => {
        const cursor = kv.openCursor();
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (!c) return;
          if (String(c.key).startsWith('cell:') && String(c.key).endsWith(`:${home.result}`)) {
            c.update({ ...c.value, buildings: [{ id: 'farm', builtAt: Date.now() }] });
            return;
          }
          c.continue();
        };
      };
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

/**
 * A Keep in the pouch record, as on a Season 2 save. The app rewrites `resources` on every
 * settle, so write until it stays (same race `keep-citizens.spec.ts` works around).
 */
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

test('a hand sent from the Works tab goes to work, and stands on the map (BRDC-LEDGER-002)', async ({ page }) => {
  test.setTimeout(180_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await farmOnHearth(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await clear(page);

  await page.getByRole('button', { name: 'Lands', exact: true }).click();
  const lands = page.getByRole('region', { name: 'Your lands' });
  await lands.getByRole('tab', { name: 'Works' }).click();
  await expect(lands).toContainText('1 citizen free', { timeout: 10_000 });
  await expect(lands.getByRole('list', { name: 'Works' })).toContainText('0 / 1 at work');

  await lands.getByRole('button', { name: 'Send a citizen to the Farm' }).click();
  await expect(lands).toContainText('0 citizens free');
  await expect(lands.getByRole('list', { name: 'Works' })).toContainText('1 / 1 at work');

  // The map follows at once (BRDC-MAP-009): the citizen layer has a feature for the farm.
  await page.keyboard.press('Escape');
  await page.evaluate(() => (globalThis as unknown as { __esMap: import('maplibre-gl').Map }).__esMap.setZoom(17));
  const citizens = () =>
    page.evaluate(() => (globalThis as unknown as { __esMap: import('maplibre-gl').Map }).__esMap.querySourceFeatures('hex-citizens').length);
  await expect.poll(citizens, { timeout: 30_000 }).toBeGreaterThan(0);
});

test('the Ledger lists hexes, Works, temples and anomalies, and a row opens its hex', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await farmOnHearth(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await clear(page);

  await page.getByRole('button', { name: 'Lands', exact: true }).click();
  const lands = page.getByRole('region', { name: 'Your lands' });
  await expect(lands.getByRole('tab')).toHaveText(['Hexes', 'Works', 'Temples', 'Anomalies']);

  // Hexes: a filter chip shows its count, and the list follows it.
  const chip = lands.getByRole('button', { name: /^Unrevealed · \d+$/ });
  const n = Number((await chip.textContent())?.match(/(\d+)$/)?.[1]);
  await chip.click();
  await expect(lands.getByRole('list', { name: 'Hexes' }).getByRole('listitem')).toHaveCount(n);

  // Works: the farm, what its hex makes, and a tap that opens the hex.
  await lands.getByRole('tab', { name: 'Works' }).click();
  const works = lands.getByRole('list', { name: 'Works' });
  await expect(works).toContainText('Farm', { timeout: 10_000 });
  await expect(works).toContainText(/\/h|makes nothing/);

  await lands.getByRole('tab', { name: 'Temples' }).click();
  await expect(lands).toContainText('No temple yet');
  await lands.getByRole('tab', { name: 'Anomalies' }).click();
  await expect(lands.getByRole('button', { name: /^Untouched · \d+$/ })).toBeVisible();

  await lands.getByRole('tab', { name: 'Works' }).click();
  await works.getByRole('button').first().click();
  await expect(page.getByRole('region', { name: 'Selected cell' })).toBeVisible({ timeout: 15_000 });
});
