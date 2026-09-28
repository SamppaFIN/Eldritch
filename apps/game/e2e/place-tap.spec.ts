import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-MAP-007 — a tap on the Anchor Stone answers as the Anchor, not as the plain hex
 * under it. MapLibre turned the marker's string id into a number, so the place handler
 * never fired and every such tap fell through to the cell card.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('tapping the Anchor Stone opens the sanctuary, not a cell card', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page, HERE);
  await page.waitForTimeout(14_000); // the founding tour lands back on the Hearth
  await page.locator('.unlock__card').getByRole('button', { name: 'Not now' }).click({ timeout: 1_000 }).catch(() => undefined);

  // The Anchor's marker, read off the map rather than guessed from the screen.
  const at = await page.evaluate(() => {
    const map = (globalThis as unknown as {
      __esMap: {
        querySourceFeatures: (s: string) => { geometry: { coordinates: [number, number] }; properties: { kind?: string } }[];
        project: (c: [number, number]) => { x: number; y: number };
      };
    }).__esMap;
    const anchor = map.querySourceFeatures('places').find((f) => f.properties.kind === 'anchor');
    return anchor ? map.project(anchor.geometry.coordinates) : null;
  });
  expect(at).not.toBeNull();
  await page.locator('canvas').first().click({ position: { x: at!.x, y: at!.y } });

  await expect(page.getByRole('region', { name: 'Your sanctuary' })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('region', { name: 'Selected cell' })).toBeHidden();
});
