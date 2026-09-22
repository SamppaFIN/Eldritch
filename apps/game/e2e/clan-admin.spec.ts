import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-CLAN-003 — the founder's own view: rename the clan, remove a member. Shown only
 * on the device that holds the clan's `founderToken`, which `POST /clan` hands back
 * once, at creation.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the founder can rename the clan and see it take', async ({ page }) => {
  await page.route('**/clan', (route) =>
    route.fulfill({ status: 200, json: { id: 'WYRM42', founderToken: 'secret-token' } }),
  );
  await page.route('**/clan/WYRM42/roster', (route) => route.fulfill({ status: 200, json: { members: [] } }));
  let renamed: unknown = null;
  await page.route('**/clan/WYRM42/rename', async (route) => {
    renamed = JSON.parse(route.request().postData() ?? '{}');
    return route.fulfill({ status: 200, json: { ok: true } });
  });

  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Clan Join or start a friend circle' }).click();
  await page.getByRole('textbox', { name: 'Clan name' }).fill('The Pale March');
  await page.getByRole('button', { name: 'Create clan' }).click();

  const panel = page.getByRole('region', { name: 'Clan' });
  await expect(panel).toContainText('Only this device can manage');

  const renameField = page.getByRole('textbox', { name: 'Rename' });
  await renameField.fill('The Golden March');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(panel).toContainText('You march under The Golden March');
  expect(renamed).toEqual({ founderToken: 'secret-token', name: 'The Golden March' });
});

test('the founder can remove a member, who drops out of the roster', async ({ page }) => {
  await page.route('**/clan', (route) =>
    route.fulfill({ status: 200, json: { id: 'WYRM42', founderToken: 'secret-token' } }),
  );
  await page.route('**/clan/WYRM42/roster', (route) =>
    route.fulfill({
      status: 200,
      json: { members: [{ id: 'friend-1', name: 'Wanderer', castle: '8b112492eb03fff' }] },
    }),
  );
  let kicked: unknown = null;
  await page.route('**/clan/WYRM42/kick', async (route) => {
    kicked = JSON.parse(route.request().postData() ?? '{}');
    return route.fulfill({ status: 200, json: { ok: true } });
  });

  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Clan Join or start a friend circle' }).click();
  await page.getByRole('textbox', { name: 'Clan name' }).fill('The Pale March');
  await page.getByRole('button', { name: 'Create clan' }).click();

  const panel = page.getByRole('region', { name: 'Clan' });
  await expect(panel.locator('.clan__roster')).toContainText('Wanderer');
  await page.getByRole('button', { name: 'Remove' }).click();

  // The roster empties out entirely rather than leaving a stale row behind.
  await expect(panel.locator('.clan__roster')).toHaveCount(0);
  await expect(panel).toContainText('Nobody has published under this clan yet.');
  expect(kicked).toEqual({ founderToken: 'secret-token', playerId: 'friend-1' });
});
