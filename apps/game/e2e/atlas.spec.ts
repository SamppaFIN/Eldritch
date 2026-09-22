import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-ATLAS-001 — the national view: zoomed all the way out, res-5 municipalities
 * instead of res-11 dust.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const REGION_TAMPERE = '85088a2ffffffff';
const REGION_HELSINKI = '851126d3fffffff';

/** The live map's centre and zoom, read off the global the app exposes for tests. */
function mapState(page: Page): Promise<{ lng: number; lat: number; zoom: number }> {
  return page.evaluate(() => {
    const m = (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
    const c = m.getCenter();
    return { lng: c.lng, lat: c.lat, zoom: m.getZoom() };
  });
}

async function waitForCameraStill(page: Page, timeoutMs = 25_000) {
  const started = Date.now();
  let last = await mapState(page);
  while (Date.now() - started < timeoutMs) {
    await page.waitForTimeout(400);
    const next = await mapState(page);
    if (next.lng === last.lng && next.lat === last.lat && next.zoom === last.zoom) return;
    last = next;
  }
  throw new Error('the camera never stopped moving');
}

/**
 * A fresh Hearth also runs the one-time founding tour (BRDC-CLAIM-012), which flies the
 * camera around on its own schedule and only starts a beat or two after the map itself
 * looks settled — racing it with a "has the camera stopped moving" poll is exactly the
 * flakiness `map.spec.ts` warns about. This spec cares about the Atlas layer, not the
 * tour, so it is switched off the same way `enableLoopClosure` pre-seeds a setting: mark
 * the tour's own one-shot flag as already spent before the app boots.
 */
async function skipHearthTour(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('es3:hearth-tour', '1');
  });
}

async function openMap(page: Page) {
  await skipHearthTour(page);
  await open(page, HERE);
  await waitForCameraStill(page);
}

/** A programmatic setZoom carries no originalEvent, so useCameraFollow reads it as not
 *  a manual move and keeps overriding it — the same reason map.spec.ts's own pan test
 *  drags with the mouse instead of calling the map directly. A real drag first unpins
 *  the camera; only then does a later setZoom actually stick. */
async function unpinCamera(page: Page) {
  const vs = page.viewportSize();
  const sx = (vs?.width ?? 360) - 20;
  const sy = (vs?.height ?? 640) / 2;
  const unpinned = page.getByRole('button', { name: 'Recenter the map on you' });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i += 1) {
      await page.mouse.move(sx - i * 20, sy - i * 7);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    if (await unpinned.isVisible().catch(() => false)) break;
  }
  await expect(unpinned).toBeVisible();
}

async function setZoom(page: Page, zoom: number) {
  await page.evaluate(
    (z) => (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap.setZoom(z),
    zoom,
  );
}

const nationFeatureCount = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const m = (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
    if (!m.getLayer('nation-fill')) return -1;
    return m.queryRenderedFeatures(undefined, { layers: ['nation-fill'] }).length;
  });

test('draws a municipality per region once zoomed out past the Atlas boundary', async ({ page }) => {
  await page.route('**/atlas', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        v: 1,
        generatedAt: Date.now(),
        regions: [
          { region: REGION_TAMPERE, dominant: { id: 'a', name: 'Alice' }, areaM2: 4865, players: 1 },
          { region: REGION_HELSINKI, dominant: { id: 'b', name: 'Bob' }, areaM2: 1660, players: 1 },
        ],
      }),
    }),
  );

  await openMap(page);
  // Still at walking zoom — the Atlas layer has a maxzoom and must not draw here.
  expect(await nationFeatureCount(page)).toBe(0);

  await unpinCamera(page);
  await setZoom(page, 4);
  await expect.poll(() => nationFeatureCount(page), { timeout: 10_000 }).toBe(2);
});

test('draws nothing when the Atlas has no data yet, not an error', async ({ page }) => {
  await page.route('**/atlas', (route) => route.fulfill({ status: 204 }));

  await openMap(page);
  await unpinCamera(page);
  await setZoom(page, 4);
  await page.waitForTimeout(500);
  expect(await nationFeatureCount(page)).toBe(0);
});
