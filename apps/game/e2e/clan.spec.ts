import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-CLAN-001 — creating and joining a clan, and that a submit carries it along.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openClan(page: Page) {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Clan Join or start a friend circle' }).click();
}

test('creating a clan shows the code, and it survives a reopen', async ({ page }) => {
  await page.route('**/clan', (route) =>
    route.fulfill({
      status: 200,
      json: { id: 'WYRM42', founderToken: 'secret-token' },
    }),
  );

  await openMap(page, HERE);
  await openClan(page);

  await page.getByRole('textbox', { name: 'Clan name' }).fill('The Pale March');
  await page.getByRole('button', { name: 'Create clan' }).click();

  const panel = page.getByRole('region', { name: 'Clan' });
  await expect(panel).toContainText('The Pale March');
  await expect(panel).toContainText('WYRM42');

  // A localStorage record, not a server session — closing and reopening reads it back
  // without asking the Worker again.
  await page.keyboard.press('Escape');
  await openClan(page);
  await expect(panel).toContainText('The Pale March');
  await expect(panel).toContainText('WYRM42');
});

test('joining looks the code up before committing to it', async ({ page }) => {
  await page.route('**/clan/NOPE00', (route) => route.fulfill({ status: 404 }));

  await openMap(page, HERE);
  await openClan(page);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.getByRole('textbox', { name: 'Clan code' }).fill('nope00');
  await page.getByRole('button', { name: 'Join clan' }).click();

  await expect(page.getByText("That code doesn't match a clan.")).toBeVisible();
});

test('a clan id rides along on the next submit', async ({ page }) => {
  await page.route('**/clan', (route) =>
    route.fulfill({ status: 200, json: { id: 'WYRM42', founderToken: 'tok' } }),
  );
  let posted: { clanId?: unknown } | null = null;
  await page.route('**/submit', async (route) => {
    posted = JSON.parse(route.request().postData() ?? '{}');
    return route.fulfill({ status: 200, json: { ok: true, cells: 1, regions: 1 } });
  });
  await page.route('**/world/**', (route) => route.fulfill({ status: 204, body: '' }));

  await openMap(page, HERE);
  await openClan(page);
  await page.getByRole('textbox', { name: 'Clan name' }).fill('The Pale March');
  await page.getByRole('button', { name: 'Create clan' }).click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('switch', { name: 'Share your realm' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect(page.getByLabel('Your sanctuary')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Raise your banner' }).click();
  await expect(page.getByText('Others see your realm within the hour.')).toBeVisible({
    timeout: 10_000,
  });

  expect(posted?.clanId).toBe('WYRM42');
});
