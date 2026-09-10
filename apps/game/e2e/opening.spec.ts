import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * The opening loop, end to end: you are given a stash, you can see it, and you can spend
 * it on the one thing it is sized for.
 *
 * This exists because all three failed at once (BRDC-ECON-009) and the report was "no
 * button does anything". The founding stash is exactly one Monument — 60 stone and 10
 * culture — so the very first thing a new player is meant to do was the thing that could
 * not be done.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

test('the founding stash reaches the HUD promptly', async ({ page }) => {
  /*
   * A timing bound, and it is the honest proxy for the bug rather than the bug itself.
   * `useAdventure` was handed a fresh millisecond every render, so its fetch re-ran every
   * render, and each run settled the whole pouch and swept every owned cell. Six full
   * IndexedDB round-trips a second, forever — so every other read queued behind it and
   * the pouch took between seven and fifteen seconds to appear, getting worse the longer
   * the page stayed open. It is about four seconds now, and stable.
   */
  await openMap(page);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 8_000 });
});

test('and it can be spent on the building it is sized for', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 20_000 });

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 10_000 });

  // The build menu judges affordability from the same pouch copy the HUD shows, so while
  // that copy was empty every building read "Cannot afford" and the section said nothing
  // could be built here at all.
  await expect(card).toContainText('Monument');
  const build = card.getByRole('button', { name: 'Build', exact: true }).first();
  await expect(build).toBeEnabled();
  await build.click();

  await expect(card).toContainText('Standing here', { timeout: 15_000 });
  await expect(card).toContainText(/Demolish/i);
});
