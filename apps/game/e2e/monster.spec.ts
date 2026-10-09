import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
// Subpath imports, not the barrel (see encounter.spec.ts).
import { cellAt, cellsWithin, hexDistance } from '@es3/core/geo';
import { releases } from '@es3/core/rules';
import { openMap } from './hearth.js';

/**
 * BRDC-MONSTER-001 — a creature out of a gate walks on the Keep; standing on its hex, it
 * is faced on Vigor from the hex card.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const HOME = cellAt({ lat: HERE.latitude, lng: HERE.longitude });
const FROM = cellsWithin(HOME, 3).find((h) => hexDistance(h, HOME) === 3) as string;
const GATE = Array.from({ length: 50 }, (_, i) => `e2e-${i}`).find(releases) as string;

/** A Keep, and a gate three rings out opened three days ago: what came out of it is at the Hearth. */
async function seed(page: Page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const kept = await page.evaluate(({ gate, from }) => new Promise<boolean>((resolve) => {
      const open = indexedDB.open('es3');
      open.onsuccess = () => {
        const tx = open.result.transaction('kv', 'readwrite');
        const kv = tx.objectStore('kv');
        kv.put({ gates: [{ id: gate, h3: from, openedAt: Date.now() - 3 * 86_400_000 - 60_000 }], dawn: 999, bitten: {}, outbox: [] }, 'gates');
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
    }), { gate: GATE, from: FROM });
    if (kept) return;
  }
  throw new Error('the Keep would not stay seeded');
}

test('a creature that reached the Hearth is faced from its hex', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await seed(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const here = page.getByRole('button', { name: 'Here', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    return here.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await here.click();

  const creature = page.getByRole('region', { name: 'Selected cell' }).getByRole('region', { name: 'Creature' });
  await expect(creature).toContainText('It came out of a gate and walks on your Keep', { timeout: 20_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/monster.png' });
  await creature.getByRole('button', { name: /^Face it · Vigor test/ }).click();
  // Faced, whichever way it went: the test costs a point of health either way. Read from the
  // store — the card's own line can be lost to a re-render of the sheet.
  await expect.poll(() => page.evaluate(() => new Promise<number | undefined>((res) => {
    const o = indexedDB.open('es3');
    o.onsuccess = () => {
      const g = o.result.transaction('kv', 'readonly').objectStore('kv').get('investigator');
      g.onsuccess = () => { o.result.close(); res((g.result as { stamina?: number } | undefined)?.stamina); };
    };
  })), { timeout: 10_000 }).toBeLessThan(7);
});
