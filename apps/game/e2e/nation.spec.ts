import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * Field report 2026-09-06: the name would not change in the "You" panel, and a banner
 * picked in the Keep never reached the map. Both fixed — this proves them.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the You panel renames the player, and it sticks over a reopen', async ({ page }) => {
  test.setTimeout(60_000);
  await openMap(page, HERE);

  await page.getByRole('button', { name: 'You' }).click();
  const field = page.getByLabel('Name', { exact: true });
  await expect(field).toBeVisible();

  await field.fill('Cornelius');
  await field.blur();

  // Close and reopen — the write went to storage, not just local state.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'You' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Cornelius');
});

test('a banner picked in the Keep reaches the map flag layer', async ({ page }) => {
  test.setTimeout(60_000);
  await openMap(page, HERE);

  const flagIcon = () =>
    page.evaluate(() => {
      const map = (globalThis as unknown as { __esMap?: { getLayoutProperty: (l: string, p: string) => unknown } })
        .__esMap;
      return map?.getLayoutProperty('cells-flag', 'icon-image') ?? null;
    });

  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const before = await flagIcon();

  // The flag button opens the picker; 'triquetra' is never the default ('vesica').
  await page.getByRole('button', { name: /^Banner:/ }).click();
  await page
    .getByRole('group', { name: 'Choose a banner' })
    .getByRole('button', { name: 'triquetra' })
    .click();

  await expect.poll(flagIcon).toBe('banner-triquetra');
  expect(before).not.toBe('banner-triquetra');
});
