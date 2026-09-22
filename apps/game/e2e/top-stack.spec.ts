import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-MAP-005 — the one floating column at the top of the map.
 *
 * `FirstLook`, `GuideNews` and `MapNotices` used to each guess their own position; an
 * open cell card could draw right over their heads, or they over its. Fixed by giving
 * them one shared, owned column that disappears outright while a panel covers the map.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openCellFromLands(page: Page) {
  await open(page, HERE);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 25_000 });
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Your lands' }).click();
  const lands = page.getByRole('region', { name: 'Your lands' });
  await expect(lands).toBeVisible({ timeout: 15_000 });
  await lands.locator('.lands__cell').first().click();
  await expect(page.getByRole('region', { name: 'Selected cell' })).toBeVisible({ timeout: 15_000 });
}

test('the top-of-screen hint shows on a fresh map, with nothing else open', async ({ page }) => {
  await open(page, HERE);
  // A brand new profile is mid the opening ladder — the walk hint is the very first rung.
  await expect(page.locator('.top-stack')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.first-look__card')).toBeVisible();
});

test('an open cell card empties the top-of-screen column, not draws over it', async ({ page }) => {
  await openCellFromLands(page);
  // TopStack renders nothing at all while a sheet covers the map — the overlap this
  // ticket was written for cannot occur by construction, not by z-index arithmetic.
  await expect(page.locator('.top-stack')).toHaveCount(0);
});

test('closing the card brings the hint back', async ({ page }) => {
  await openCellFromLands(page);
  await expect(page.locator('.top-stack')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Selected cell' })).toBeHidden();
  await expect(page.locator('.top-stack')).toBeVisible({ timeout: 5_000 });
});
