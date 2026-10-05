import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-CARD-006 — a hex you hold says, per resource, where its yield comes from. The
 * numbers are the per-hex model the pouch is paid by (BRDC-YIELD-001, unit-tested there).
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('your own hex shows its yield per hour, source by source', async ({ page }) => {
  await openMap(page, HERE);
  const unlock = page.getByRole('dialog', { name: 'The ground pays' });
  if (await unlock.isVisible().catch(() => false)) await unlock.getByRole('button', { name: 'Not now' }).click();
  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 15_000 });
  const perHour = card.getByRole('region', { name: 'Yield per hour' });
  await expect(perHour).toBeVisible({ timeout: 10_000 });
  await expect(perHour).toContainText(/→|Nothing yet/);
  await expect(card).not.toContainText(/10 (wood|stone|food|gold) ·/); // the old claim payout line
});
