import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/** BRDC-MAP-008 — each hex of yours shows what it makes at street zoom, and a toggle hides it. */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const overlay = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const map = (globalThis as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
    return {
      points: map.querySourceFeatures('hex-yields').length,
      visible: map.getLayoutProperty('hex-yields-c', 'visibility') === 'visible',
    };
  });

test('the overlay shows at street zoom and the toggle hides it', async ({ page }) => {
  await openMap(page, HERE);
  const unlock = page.getByRole('dialog', { name: 'The ground pays' });
  if (await unlock.isVisible().catch(() => false)) await unlock.getByRole('button', { name: 'Not now' }).click();
  await page.evaluate(() => (globalThis as unknown as { __esMap: import('maplibre-gl').Map }).__esMap.setZoom(17));
  await expect.poll(async () => (await overlay(page)).points, { timeout: 15_000 }).toBeGreaterThan(0);
  expect((await overlay(page)).visible).toBe(true);

  // A lesson card can come due at any moment and lies over the map controls.
  const clear = async () => {
    const card = page.getByRole('dialog', { name: /./ }).filter({ has: page.getByRole('button', { name: 'Not now' }) });
    if (await card.isVisible().catch(() => false)) await card.getByRole('button', { name: 'Not now' }).click();
  };
  await clear();
  await page.getByRole('button', { name: 'Hide yields on the map' }).click();
  await expect.poll(async () => (await overlay(page)).visible).toBe(false);
  await clear();
  await page.getByRole('button', { name: 'Show yields on the map' }).click();
  await expect.poll(async () => (await overlay(page)).visible).toBe(true);
});
