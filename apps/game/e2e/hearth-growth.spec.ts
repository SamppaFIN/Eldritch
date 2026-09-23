import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-HEARTH-003 — the Keep offers to push the Hearth's border out for food. A fresh
 * game has none (the founding stash is stone and culture), so the button is there, says
 * what it costs, and is disabled; the growth itself is covered against the repository.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the Keep shows the Hearth’s reach and the food a new ring costs', async ({ page }) => {
  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();

  const keep = page.getByLabel('Your sanctuary');
  await expect(keep).toBeVisible();

  const growth = keep.getByLabel('Grow the Hearth');
  await expect(growth).toContainText('Hearth reach 1 of 6');
  // Ring 2 is twelve hexes at five food each.
  const button = growth.getByRole('button', { name: 'Grow the Hearth · 60 food' });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
});
