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
/** `REGION_HELSINKI`'s own centre, h3.cellToLatLng once by hand (h3-js is a dependency
 *  of @es3/core, not of this app, so it is not importable from a Node-run spec file). */
const HELSINKI_CENTRE = { lat: 60.20612303713854, lng: 24.976852103066726 };

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

/** Where a lng/lat currently lands on screen, so a real mouse click can hit it. */
function screenPointFor(page: Page, lng: number, lat: number): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ([lng, lat]) => {
      const m = (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
      const p = m.project([lng, lat]);
      return { x: p.x, y: p.y };
    },
    [lng, lat],
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

test('tapping a municipality flies the camera out to it', async ({ page }) => {
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
  await unpinCamera(page);
  await setZoom(page, 4);
  await expect.poll(() => nationFeatureCount(page), { timeout: 10_000 }).toBe(2);

  // A stationary player reads as "not walking" to the onboarding teacher (BRDC-TUTOR-001),
  // and this spec has been idle long enough for a lesson card to come due and cover the
  // map — tutor.spec.ts's own way of clearing it.
  const unlockCard = page.locator('.unlock__card');
  if (await unlockCard.isVisible().catch(() => false)) {
    await unlockCard.getByRole('button', { name: 'Not now' }).click();
  }

  const point = await screenPointFor(page, HELSINKI_CENTRE.lng, HELSINKI_CENTRE.lat);
  // `map.project` returns coordinates relative to the map's own container, which is what
  // a canvas click's `position` expects — not page coordinates (step-claim.spec.ts's own
  // pattern for tapping the map directly rather than through a locator).
  await page.locator('canvas').first().click({ position: point });

  await expect
    .poll(() => mapState(page).then((s) => s.zoom), { timeout: 10_000 })
    .toBeGreaterThan(11);
  const landed = await mapState(page);
  // Within a few kilometres of the municipality's own centre, not exactly on it —
  // flyTo settles smoothly rather than snapping to the pixel, and the target itself is
  // wherever the tap's own coordinates resolve to (BRDC-ATLAS-001 field report:
  // the tapped feature's own id does not survive MapLibre's tiling intact).
  expect(Math.abs(landed.lng - HELSINKI_CENTRE.lng)).toBeLessThan(0.05);
  expect(Math.abs(landed.lat - HELSINKI_CENTRE.lat)).toBeLessThan(0.05);
});
