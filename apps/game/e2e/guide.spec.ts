import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-WIKI-003 — the guide is browsable like a wiki: from the menu to the Reference, to
 * a building's own page, and back; a search box narrows the lot.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the guide reaches a derived page and searches', async ({ page }) => {
  test.setTimeout(60_000);
  await openMap(page, HERE);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Guide' }).click();

  const panel = page.getByRole('region', { name: 'Guide' });
  await expect(panel).toBeVisible();

  // Reference is always there, unlike the met-only topic groups.
  await expect(panel.getByRole('heading', { name: 'Reference' })).toBeVisible();
  await panel.getByRole('button', { name: 'Sawmill', exact: true }).click();

  // The derived page: its name, its effect, and a live status line.
  await expect(page.getByRole('region', { name: 'Sawmill' })).toBeVisible();
  await expect(page.getByText(/\+5 timber \/ h/)).toBeVisible();
  await expect(page.getByText(/None built yet|Held on/)).toBeVisible();

  // A cross-link goes on to the technology, and "‹ Guide" comes back.
  await page.getByRole('button', { name: 'Forestry', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Forestry' })).toBeVisible();
  await page.locator('.help-panel__back').click();

  await page.getByRole('searchbox', { name: 'Search the guide' }).fill('fortress');
  const results = page.getByRole('navigation', { name: 'Search results' });
  await expect(results.getByRole('button', { name: 'Fortress', exact: true })).toBeVisible();
  await expect(results.getByRole('button', { name: 'Sawmill', exact: true })).toHaveCount(0);
});

test('a build-menu row opens the building page (BRDC-WIKI-004)', async ({ page }) => {
  test.setTimeout(90_000);
  await openMap(page, HERE);

  // Tap the Hearth cell (centre of the screen) to open its card and its build menu.
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: (box?.width ?? 320) / 2, y: (box?.height ?? 600) / 2 } });

  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 8_000 });

  await card.getByRole('button', { name: 'Monument', exact: true }).click();
  const page2 = page.getByRole('region', { name: 'Monument' });
  await expect(page2).toBeVisible();
  await expect(page2.getByText(/None built yet|Held on/)).toBeVisible();
});
