import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-SEASON-004 — the door between seasons. With Season 2 open, a Season 1 realm must
 * retire before it plays on; with the season sealed, its close is shown and the map freezes.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify(body),
});
const season = (over: Record<string, unknown>) => ({
  n: 2, name: 'The Low Water', seed: 's2', phase: 'open', opensAt: Date.now() - 86_400_000, doom: 0, bossHp: 0, bossMaxHp: 0, ...over,
});

test('Season 2 open: a Season 1 realm is asked to retire, and cannot wave it away', async ({ page }) => {
  await page.route('**/season', (route) => route.fulfill(json(season({}))));
  await openMap(page, HERE);
  const notice = page.getByRole('dialog', { name: 'Retire your kingdom to the history books' });
  await expect(notice).toBeVisible({ timeout: 20_000 });
  await expect(notice.getByRole('button', { name: 'Close' })).toHaveCount(0);
  await expect(notice.getByRole('textbox')).toHaveValue('Season 1');
  await page.keyboard.press('Escape');
  await expect(notice).toBeVisible();
  await expect(notice.getByRole('button', { name: 'Retire to the history books' })).toBeEnabled();
});

test('a sealed season shows its close and the Legacy', async ({ page }) => {
  await page.route('**/season', (route) => route.fulfill(json(season({ phase: 'sealed', outcome: 'quiet', sealedAt: Date.now() }))));
  await openMap(page, HERE);
  const close = page.getByRole('dialog', { name: 'The Lake Is Quiet' });
  await expect(close).toBeVisible({ timeout: 20_000 });
  await expect(close).toContainText('The map is frozen');
  await expect(close).toContainText('Legacy');
});
