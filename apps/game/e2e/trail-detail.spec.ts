import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import gpsNoise from '@es3/core/sim/fixtures/gps-noise.json' with { type: 'json' };

/**
 * The boxes left open on TRAIL-001, TRAIL-002 and HUD-001.
 *
 * These are the claims that were easy to assume and are worth actually measuring:
 * that batching batches, that the HUD leaves room for the map, that a bad fix says so,
 * and that a long trail does not fall over.
 */
const START = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
const north = (metres: number) => metres / 111_320;

test.use({ permissions: ['geolocation'], geolocation: START });

async function openMap(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
}

async function trailPointCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const map = (
      globalThis as unknown as {
        __esMap?: {
          getSource: (id: string) => { serialize?: () => { data?: unknown } } | undefined;
        };
      }
    ).__esMap;
    const data = map?.getSource('trail')?.serialize?.().data as
      | { features?: Array<{ geometry?: { coordinates?: unknown[] } }> }
      | undefined;
    return data?.features?.[0]?.geometry?.coordinates?.length ?? 0;
  });
}

test('fixes are written in batches, not one per tick', async ({ page }) => {
  // TRAIL-001. Ten seconds of buffering is a battery decision: an hour's walk is
  // ~3600 fixes, and writing each one is how you arrive home with a dead phone.
  //
  // Observed from outside rather than by counting calls: over a walk that produces
  // roughly six accepted fixes, the trail must grow in a handful of jumps, not once
  // per fix. If batching were broken the count would step every time.
  test.setTimeout(120_000);
  await openMap(page);

  const changes: number[] = [];
  let previous = await trailPointCount(page);
  let walking = true;

  const observer = (async () => {
    while (walking) {
      const now = await trailPointCount(page);
      if (now !== previous) {
        changes.push(now);
        previous = now;
      }
      await page.waitForTimeout(400);
    }
  })();

  for (let i = 1; i <= 7; i++) {
    await page.context().setGeolocation({
      latitude: START.latitude + north(12 * i),
      longitude: START.longitude,
      accuracy: 8,
    });
    await page.waitForTimeout(5_400);
  }
  await page.waitForTimeout(12_000);
  walking = false;
  await observer;

  expect(previous).toBeGreaterThan(2); // the walk did register
  // ~45 s of walking is at most five ten-second windows.
  expect(changes.length).toBeLessThanOrEqual(6);
  expect(changes.length).toBeLessThan(previous);
});

test('the HUD leaves the map most of the screen', async ({ page }) => {
  // HUD-001. The map is the game; a status panel that eats half a phone screen
  // is a status panel that gets in the way of walking.
  await openMap(page);

  const hud = await page.locator('.hud').boundingBox();
  const view = page.viewportSize();
  const ratio = (hud?.height ?? 0) / (view?.height ?? 1);

  expect(ratio).toBeLessThan(0.3);
});

test('a fix too poor to use says exactly that', async ({ page }) => {
  // HUD-001. MAX_ACCURACY_M is 50, so 80 m is past the point of being usable.
  // Silence here is what made v2 players think the game had frozen.
  await page.context().setGeolocation({ ...START, accuracy: 80 });
  await openMap(page);

  const signal = page.locator('.hud__signal');
  await expect(signal).toContainText(/too weak|cannot form/i, { timeout: 20_000 });
  await expect(signal).toHaveAttribute('data-quality', 'rejected');
});

test('the XP bar carries its value to assistive tech', async ({ page }) => {
  // The bar cannot be seen to move until claiming exists (Phase 2), but it can be
  // checked for being a progressbar with a real value rather than a coloured div.
  await openMap(page);
  const bar = page.getByRole('progressbar');
  await expect(bar).toHaveAttribute('aria-valuenow', /^\d+$/);
  await expect(bar).toHaveAttribute('aria-valuemax', '100');
});

test('renders the noisy fixture without complaint', async ({ page }) => {
  // TRAIL-002. gps-noise is the 120 m block under heavy multipath — the shape the
  // renderer will actually meet in a city, rather than the clean line a test walk draws.
  await openMap(page);

  const drawn = await page.evaluate((points) => {
    const map = (
      globalThis as unknown as {
        __esMap?: {
          getSource: (id: string) => {
            setData?: (d: unknown) => void;
            serialize?: () => { data?: unknown };
          };
        };
      }
    ).__esMap;
    const source = map?.getSource('trail');
    source?.setData?.({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: points.map((p) => [p.lng, p.lat]),
          },
        },
      ],
    });
    const data = source?.serialize?.().data as
      | { features?: Array<{ geometry?: { coordinates?: unknown[] } }> }
      | undefined;
    return data?.features?.[0]?.geometry?.coordinates?.length ?? 0;
  }, gpsNoise.points);

  expect(drawn).toBe(gpsNoise.points.length);
});

test('a 2000-point trail still renders and the map stays responsive', async ({ page }) => {
  // TRAIL-002. An hour of walking is roughly 500 points; 2000 is a long evening.
  // One GeoJSON source is the reason this is cheap — v2 would have been 2000 DOM nodes.
  test.setTimeout(90_000);
  await openMap(page);

  const elapsed = await page.evaluate(() => {
    const map = (
      globalThis as unknown as {
        __esMap?: {
          getSource: (id: string) => { setData?: (d: unknown) => void };
          getCenter: () => { lat: number; lng: number };
        };
      }
    ).__esMap;
    if (!map) return -1;

    const c = map.getCenter();
    const coordinates = Array.from({ length: 2000 }, (_, i) => [
      c.lng + Math.sin(i / 40) * 0.004,
      c.lat + i * 0.000_02,
    ]);

    const started = performance.now();
    map.getSource('trail')?.setData?.({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } },
      ],
    });
    return performance.now() - started;
  });

  // setData hands the work to the worker; the main thread must not stall on it.
  expect(elapsed).toBeGreaterThanOrEqual(0);
  expect(elapsed).toBeLessThan(250);

  // And the map is still alive afterwards.
  await expect(page.locator('.es-player__core')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Withdraw' })).toBeEnabled();
});
