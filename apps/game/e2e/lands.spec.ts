import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-LANDS-001 — the ledger of held ground.
 *
 * The map answers "where am I". Past a few dozen hexes it cannot answer "what have I got",
 * and the realm this was asked for holds three hundred and forty.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openLands(page: Page) {
  await open(page, HERE);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 25_000 });
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Your lands' }).click();
  const lands = page.getByRole('region', { name: 'Your lands' });
  await expect(lands).toBeVisible({ timeout: 15_000 });
  return lands;
}

test('lists every hex held, with what it is and what it wants', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);

  // The Hearth ring is seven cells, so that is what a fresh realm has.
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });
  await expect(lands).toContainText('7 held');
  await expect(lands).toContainText('7 unrevealed');

  // Each row carries the ground, the yield, the strength, the days walked and the clock.
  const first = lands.locator('.lands__row').first();
  await expect(first).toContainText(/Plain|Forest|Hill|Mountain|Lake|Coast|Market/);
  await expect(first).toContainText(/d walked/);
});

test('puts unrevealed ground first, and never counts the Hearth as fading', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });

  // Unrevealed first is the whole opinion of the order: revealing is free, pays every
  // time, and is the one thing on this list that needs no walking.
  const tags = await lands.locator('.lands__row .lands__tag--new').count();
  expect(tags).toBe(7);

  // The Hearth cannot be lost, so it carries no countdown (BRDC-HEARTH-002).
  const hearth = lands.locator('.lands__row', { has: page.locator('.lands__tag--home') });
  await expect(hearth).toContainText('safe');
});

test('a row takes you to that hex, and ESC closes the ledger', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });

  await lands.locator('.lands__cell').first().click();
  await expect(lands).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Selected cell' })).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Your lands' }).click();
  const again = page.getByRole('region', { name: 'Your lands' });
  await expect(again).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');
  await expect(again).toHaveCount(0);
});
