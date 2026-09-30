import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';

/**
 * The Fuming Lake — begun at the Statue of the Boy, the same place for every player since
 * v0.7.3 (`anchorQuestSites(null)`), and each stage's page read only where it happens.
 *
 * Field report 2026-09-30: *"Quest line paljastaa edellisessä paikassa jo seuraavan ruudun
 * dialogin"* — a choice at the statue showed the next place's story on the spot.
 */
const STATUE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: STATUE });

test('the tale begins at the statue, and the next page waits for the next place', async ({ page }) => {
  test.setTimeout(200_000);
  await open(page, STATUE);
  const unlock = page.getByRole('dialog', { name: 'The ground pays' });
  if (await unlock.isVisible().catch(() => false)) await unlock.getByRole('button', { name: 'Not now' }).click();

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText('The tale starts here.', { timeout: 15_000 });
  await card.getByRole('button', { name: /Fuming Lake/ }).click();

  const tale = page.locator('.adventure');
  await expect(tale).toBeVisible({ timeout: 15_000 });
  // "Opening the tale…" while it is written and read back — right after boot the store is
  // busy, so give it room.
  await expect(tale).toContainText(/propeller/i, { timeout: 20_000 });
  await tale.getByRole('button', { name: /Follow the map/ }).click();

  // Still at the statue: the next place's story is not told here.
  await expect(tale).toContainText(/The tale moves on\. Walk to .+ to hear what happens there\./, { timeout: 10_000 });
  await expect(tale).not.toContainText(/propeller/i);
});
