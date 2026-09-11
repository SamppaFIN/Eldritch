import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';

/**
 * BRDC-QUEST-004 — the Fuming Lake can be begun wherever you live.
 *
 * Infinite: "koitin käydä seikkailua läpi, mutta en saanut mitään tarina dialogia.. se
 * toimi jo joskus." It had worked — near Pyynikki, where every place of the tale was a
 * fixed coordinate. Anywhere else it could not be begun at all, because beginning it
 * means standing on the statue.
 *
 * So this runs from Helsinki, which is where the old build had nothing to offer.
 */
const HELSINKI = { latitude: 60.1699, longitude: 24.9384, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HELSINKI });

test('the tale begins where the player lives, not where it was written', async ({ page }) => {
  test.setTimeout(200_000);
  await open(page, HELSINKI);

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 15_000 });

  // The statue sits on the Hearth, so the hex underfoot is where the tale starts.
  await expect(card).toContainText('The tale starts here.', { timeout: 15_000 });

  const begin = card.getByRole('button', { name: /Fuming Lake/ });
  await expect(begin).toBeVisible();
  await begin.click();

  // And it opens with narration and a choice, rather than an empty shelf.
  const tale = page.locator('.adventure');
  await expect(tale).toBeVisible({ timeout: 15_000 });
  await expect(tale).toContainText(/propeller/i);
  await expect(tale.getByRole('button', { name: /Follow the map/ })).toBeVisible();
});
