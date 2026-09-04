import { expect, test } from '@playwright/test';
import { acceptHearth, enableLoopClosure } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * The half of Phase 2's gate that a clock can stand in for.
 *
 * "Walk it again tomorrow and it strengthens. Leave it twenty days and it is released."
 * Those are the numbers the game's tempo rests on, and waiting them out is not an option
 * — the dev time machine exists precisely so they can be checked in a minute.
 *
 * Dev-only, so these run against the dev server rather than the production preview.
 *
 * BRDC-CLAIM-009 defaulted loop closure off — territory grows by stepping now — so
 * this whole file switches it back on: reinforcement and decay are the loop's own.
 */
const START = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
const BLOCK_M = 140;
const STEP_MS = 5_300;
const DEV_URL = 'http://localhost:5174/';

const dLat = (m: number) => m / 111_320;
const dLng = (m: number) => m / 53_000;

test.use({ permissions: ['geolocation'], geolocation: START });

/** The time machine is compiled out of production, so these need the dev server. */
test.beforeEach(async ({ page }) => {
  await enableLoopClosure(page);
  const response = await page.goto(DEV_URL).catch(() => null);
  test.skip(
    response === null || !response.ok(),
    'dev server not running on 5174 — start it with: pnpm --filter @es3/game dev --port 5174',
  );
});

async function openMap(page: Page) {
  // No goto: this spec loads the page itself, with the clock already wound forward.
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await acceptHearth(page, START);
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 60_000 });
}

async function walkBlock(page: Page) {
  const legs: Array<[number, number]> = [];
  const q = BLOCK_M / 4;
  for (let i = 1; i <= 4; i++) legs.push([dLat(q * i), 0]);
  for (let i = 1; i <= 4; i++) legs.push([dLat(BLOCK_M), dLng(q * i)]);
  for (let i = 1; i <= 4; i++) legs.push([dLat(BLOCK_M - q * i), dLng(BLOCK_M)]);
  for (let i = 1; i <= 4; i++) legs.push([0, dLng(BLOCK_M - q * i)]);

  for (const [lat, lng] of legs) {
    await page.context().setGeolocation({
      latitude: START.latitude + lat,
      longitude: START.longitude + lng,
      accuracy: 8,
    });
    await page.waitForTimeout(STEP_MS);
  }
  await page.waitForTimeout(13_000);
}

/** Wind the clock forward `days` days, one keypress per day. */
async function advance(page: Page, days: number) {
  for (let i = 0; i < days; i++) {
    await page.keyboard.press('t');
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(2_500);
}

const warded = (page: Page) => page.locator('.hud__value').nth(2);

test('ground fades and is eventually reclaimed', async ({ page }) => {
  test.setTimeout(240_000);
  await openMap(page);
  await walkBlock(page);
  await expect(warded(page)).not.toHaveText(/^0/);

  // A freshly claimed cell has about twelve days. At ten it should be warning.
  await advance(page, 10);
  await expect(page.locator('.hud__note--warn')).toContainText(/fade/i, { timeout: 20_000 });
  await expect(warded(page)).not.toHaveText(/^0/);

  // Past its life, the Void takes it — down to the Hearth cell, which BRDC-HEARTH-002
  // exempts from decay on purpose ("the Hearth cannot be lost"): the player agreed to
  // stand there, and losing your own home to a clock nobody watched is not the mechanic.
  await advance(page, 6);
  await expect
    .poll(async () => Number.parseInt(await warded(page).innerText(), 10), { timeout: 30_000 })
    .toBe(1);
});

test('the clock says so when it is not the real one', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page);
  await advance(page, 3);

  await expect(page.locator('.mapview__warning--dev')).toContainText(/3 days ahead/i);

  // Shift+T comes home.
  await page.keyboard.press('Shift+T');
  await expect(page.locator('.mapview__warning--dev')).toHaveCount(0);
});

/**
 * The strongest cell's own strength, read from IndexedDB directly.
 *
 * `.hud__value` index 3 used to be this; it is the Pouch now (nine resources, one
 * element) — a HUD restructuring this spec never tracked. `territory.strongest` is
 * still computed in useTerritory but nothing renders it, so the store is the only
 * honest source left, the same way claim.spec.ts's own batch-timing regression test
 * reads ownership directly rather than trust a HUD number that turned out to lie.
 */
async function strongestCell(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('es3', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const all = await new Promise<unknown[]>((resolve) => {
      const request = db.transaction('kv', 'readonly').objectStore('kv').getAll();
      request.onsuccess = () => resolve(request.result);
    });
    const profile = all.find(
      (v): v is { id: string } => typeof v === 'object' && v !== null && 'colorHue' in v,
    );
    const mine = all.filter(
      (v): v is { ownerId: string; strength: number } =>
        typeof v === 'object' &&
        v !== null &&
        'strength' in v &&
        (v as { ownerId?: string }).ownerId === profile?.id,
    );
    return mine.reduce((max, c) => Math.max(max, c.strength), 0);
  });
}

test('walking the block again on a later day reinforces it', async ({ page }) => {
  test.setTimeout(300_000);
  await openMap(page);
  await walkBlock(page);

  const strongestBefore = await strongestCell(page);
  expect(strongestBefore).toBe(100);

  await advance(page, 1);
  await walkBlock(page);

  // A consecutive day pays the streak bonus: 100 + 50 rather than 100 + 25.
  await expect.poll(() => strongestCell(page), { timeout: 30_000 }).toBeGreaterThan(strongestBefore);
});
