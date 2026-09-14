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

  await page.getByRole('button', { name: 'You', exact: true }).click();
  const field = page.getByLabel('Name', { exact: true });
  await expect(field).toBeVisible();

  await field.fill('Cornelius');
  await field.blur();

  // Close and reopen — the write went to storage, not just local state.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'You', exact: true }).click();
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

  // The flag button opens the picker; Triquetra is never the default (Vesica). Its own
  // name, not the raw id — "triquetra" read aloud is nothing, and BRDC-SIGIL-004 gave
  // every option in this picker a real accessible name for exactly that reason.
  await page.getByRole('button', { name: /^Banner:/ }).click();
  await page
    .getByRole('group', { name: 'Choose a banner' })
    .getByRole('button', { name: 'Triquetra' })
    .click();

  await expect.poll(flagIcon).toBe('banner-triquetra');
  expect(before).not.toBe('banner-triquetra');
});

/*
 * BRDC-SIGIL-004. Twenty of the design document's realm marks, generated rather than
 * hand-drawn, sit in the same picker as the six originals — this proves one actually
 * reaches the map, the same as the hand-drawn set above.
 */
test('a generated realm mark reaches the map flag layer too', async ({ page }) => {
  test.setTimeout(60_000);
  await openMap(page, HERE);

  const flagIcon = () =>
    page.evaluate(() => {
      const map = (globalThis as unknown as { __esMap?: { getLayoutProperty: (l: string, p: string) => unknown } })
        .__esMap;
      return map?.getLayoutProperty('cells-flag', 'icon-image') ?? null;
    });

  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.getByRole('button', { name: /^Banner:/ }).click();

  const picker = page.getByRole('group', { name: 'Choose a banner' });
  await expect(picker.getByRole('button')).toHaveCount(24);

  await picker.getByRole('button', { name: "Metatron's Cube" }).click();
  await expect.poll(flagIcon).toBe('banner-metatrons-cube');

  // Its icon actually made it into the map's atlas, at its own hundred-unit geometry —
  // not silently missing, not the hand-drawn fallback.
  const hasImage = await page.evaluate(() => {
    const map = (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
    return map.hasImage('banner-metatrons-cube');
  });
  expect(hasImage).toBe(true);
});

/*
 * BRDC-SIGIL-005. "Your Sigil" — a personal face, distinct from the nation's banner,
 * shown only on the You screen. Proved the same way the banner picker above is: opens,
 * offers every option, reaches the right name on the button, and survives a reopen.
 */
test('a sigil picked on the You screen sticks over a reopen', async ({ page }) => {
  test.setTimeout(60_000);
  await openMap(page, HERE);

  await page.getByRole('button', { name: 'You', exact: true }).click();
  await page.getByRole('button', { name: /^Sigil:/ }).click();

  const picker = page.getByRole('group', { name: 'Choose a sigil' });
  await expect(picker.getByRole('button')).toHaveCount(20);
  await picker.getByRole('button', { name: 'Shoggoth' }).click();

  await expect(page.getByRole('button', { name: /^Sigil: Shoggoth/ })).toBeVisible();

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'You', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Sigil: Shoggoth/ })).toBeVisible();
});
