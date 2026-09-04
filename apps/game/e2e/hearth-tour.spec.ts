import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-CLAIM-012 — the founding tour. Once, right after the Hearth is accepted, the
 * camera flies out over each of the six hexes around it and settles back on the player.
 */
const START = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: START });

test.describe.configure({ mode: 'serial' });

function camera(page: Page) {
  return page.evaluate(() => {
    const m = (globalThis as unknown as { __esMap?: { getZoom: () => number; getCenter: () => { lat: number; lng: number } } }).__esMap;
    return m ? { zoom: m.getZoom(), ...m.getCenter() } : null;
  });
}

/** Sample the camera every 400 ms for `ms`. */
async function watchCamera(page: Page, ms: number) {
  const frames: Array<{ zoom: number; lat: number; lng: number }> = [];
  for (let t = 0; t < ms; t += 400) {
    const c = await camera(page);
    if (c) frames.push(c);
    await page.waitForTimeout(400);
  }
  return frames;
}

test('the camera tours the ring, then settles on the player', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, START);

  const frames = await watchCamera(page, 14_000);
  expect(frames.length).toBeGreaterThan(10);

  // It zoomed in past walking zoom to look at a cell up close...
  const maxZoom = Math.max(...frames.map((f) => f.zoom));
  expect(maxZoom).toBeGreaterThan(16.6);

  // ...and wandered a good few metres off the Hearth while doing it...
  const maxDrift = Math.max(
    ...frames.map((f) => Math.hypot(f.lat - START.latitude, f.lng - START.longitude)),
  );
  expect(maxDrift).toBeGreaterThan(0.0002); // ~20 m+

  // ...and by the end it is back on the player at walking zoom.
  const last = frames.at(-1)!;
  expect(Math.abs(last.zoom - 16)).toBeLessThan(0.6);
  expect(Math.hypot(last.lat - START.latitude, last.lng - START.longitude)).toBeLessThan(0.0002);
});

test('the tour runs once — a reload does not replay it', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, START);
  await watchCamera(page, 14_000); // let the first tour finish

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const frames = await watchCamera(page, 8_000);
  const maxZoom = Math.max(...frames.map((f) => f.zoom));
  // No fly-out to cell-inspection zoom this time.
  expect(maxZoom).toBeLessThan(16.6);
});
