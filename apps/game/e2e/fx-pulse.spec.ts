import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-FX-004 — on the map, the anomaly's mark breathes on one stepped timer; under
 * reduced motion there is no timer at all.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const opacity = (page: Page) =>
  page.evaluate(() => (globalThis as unknown as { __esMap: import('maplibre-gl').Map }).__esMap.getPaintProperty('cells-anomaly', 'text-opacity'));

test('an anomaly mark pulses', async ({ page }) => {
  await openMap(page, HERE);
  const seen = new Set<string>();
  await expect.poll(async () => {
    seen.add(String(await opacity(page)));
    return seen.size;
  }, { timeout: 15_000 }).toBeGreaterThan(2);
});

test('and holds still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMap(page, HERE);
  const first = await opacity(page);
  await page.waitForTimeout(2_000);
  expect(await opacity(page)).toBe(first);
});
