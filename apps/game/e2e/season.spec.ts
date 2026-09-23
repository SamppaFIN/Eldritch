import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * The Season — distance and hexes gained since the trail began (BRDC-SEASON-001).
 * Open to both modes, unlike the Codex/Route Ledger split.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

async function openMenuAction(page: Page, label: string) {
  await page.getByRole('button', { name: 'Menu' }).click();
  const target = page.getByRole('button', { name: label });
  if (!(await target.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^Advanced/ }).click();
  }
  await target.click();
}

test('the Season shows what was gained since the oldest snapshot', async ({ page }) => {
  // Day keys are computed from the real clock — `daysSince` in the panel does the same
  // subtraction against `Date.now()`, so a hardcoded key would drift out from under it.
  const today = Math.floor(Date.now() / 86_400_000);
  const oldest = {
    dayKey: `day-${today - 3}`,
    generatedAt: Date.now() - 3 * 86_400_000,
    standings: [
      { id: 'me', name: 'me', distanceM: 1_000, hexes: 5 },
      { id: 'rival', name: 'Farwalker', distanceM: 500, hexes: 2 },
    ],
  };
  const latest = {
    dayKey: `day-${today}`,
    generatedAt: Date.now(),
    standings: [
      { id: 'me', name: 'me', distanceM: 1_500, hexes: 8 },
      { id: 'rival', name: 'Farwalker', distanceM: 4_500, hexes: 12 },
    ],
  };
  await page.route('**/season/history', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ days: [oldest.dayKey, latest.dayKey] }),
    }),
  );
  await page.route(`**/season/history/${oldest.dayKey}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(oldest) }),
  );
  await page.route(`**/season/history/${latest.dayKey}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(latest) }),
  );

  await openMap(page);
  await openMenuAction(page, 'The Season Gained since the trail began');

  const season = page.getByRole('region', { name: 'The Season' });
  await expect(season).toBeVisible();
  await expect(season).toContainText('Gained over the last 3 days');

  // Farwalker gained 4 km and 10 hexes, well ahead of the local player — ranked first.
  await expect(season).toContainText('Farwalker');
  await expect(season).toContainText('+4 km');
  await expect(season).toContainText('+10 hexes');

  await page.keyboard.press('Escape');
  await expect(season).toHaveCount(0);
});

test('the Season says so when no trail exists yet', async ({ page }) => {
  await page.route('**/season/history', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ days: [] }) }),
  );
  await openMap(page);
  await openMenuAction(page, 'The Season Gained since the trail began');

  const season = page.getByRole('region', { name: 'The Season' });
  await expect(season).toContainText(/No trail yet/i, { timeout: 10_000 });
});
