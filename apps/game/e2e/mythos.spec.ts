import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-MYTHOS-001 — the day's Mythos headline is read once, as an edge card, from the
 * season the Worker names; a reload the same day does not bring it back.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the day’s headline is read once', async ({ page }) => {
  test.setTimeout(150_000);
  // One opening, as the Worker would say it every time (a fresh Date.now() per request is a new season).
  const opensAt = Date.now() - 86_400_000;
  await page.route('**/season', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ n: 3, name: 'The Long Tide', seed: 's3', phase: 'open', opensAt, doom: 1, bossHp: 0, bossMaxHp: 0 }),
    }),
  );
  await openMap(page, HERE);
  // A new realm in an open season is told its rules first.
  const intro = page.getByRole('dialog', { name: 'Welcome to The Long Tide' });
  await expect(intro).toBeVisible({ timeout: 20_000 });
  await intro.getByRole('button', { name: 'Begin' }).click();
  const card = page.getByRole('button', { name: /^Mythos · .* — dismiss$/ });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  await expect(card).toHaveCount(0);

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(3_000);
  await expect(card).toHaveCount(0);
});
