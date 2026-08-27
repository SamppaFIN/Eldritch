import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * BRDC-TRAIL-001 and BRDC-TRAIL-002.
 *
 * Phase 1's real gate is a ten-minute walk outdoors. This is the part of it that can
 * be automated: a moving fix, a line that follows, and a reload that does not lose it.
 */
const START = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
const TILE_HOST = 'tiles.openfreemap.org';

/** Metres north, converted to degrees. Independent of the code under test. */
const north = (metres: number) => metres / 111_320;

test.use({ permissions: ['geolocation'], geolocation: START });

async function openMap(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
}

/**
 * Walk north in real time.
 *
 * The spacing is not decoration. MIN_POINT_INTERVAL_MS is five seconds and the
 * timestamp on a fix comes from the browser, not from us, so a test that moves the
 * player every 600 ms is not walking fast — it is submitting fixes the filter is
 * built to reject, and it would prove nothing.
 *
 * 12 m per step clears CONSOLIDATE_RADIUS_M without approaching MAX_SPEED_MS.
 */
const STEP_MS = 5_400;

async function walk(page: Page, steps: number) {
  for (let i = 1; i <= steps; i++) {
    await page.context().setGeolocation({
      latitude: START.latitude + north(12 * i),
      longitude: START.longitude,
      accuracy: 8,
    });
    await page.waitForTimeout(STEP_MS);
  }
}

/** Reads the ley-line straight off the map's own source. */
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

test('the HUD reports signal quality in words, not only colour', async ({ page }) => {
  await openMap(page);
  const signal = page.locator('.hud__signal');
  await expect(signal).toBeVisible();
  // 8 m accuracy is a clear signal.
  await expect(signal).toContainText(/Signal clear/i, { timeout: 20_000 });
  await expect(signal).toHaveAttribute('data-quality', 'good');
});

test('a weak signal is named as a weak signal', async ({ page }) => {
  await page.context().setGeolocation({ ...START, accuracy: 42 });
  await openMap(page);
  await expect(page.locator('.hud__signal')).toContainText(/uncertain/i, { timeout: 20_000 });
});

test('a refused permission explains itself instead of freezing', async ({ browser }) => {
  const context = await browser.newContext({ permissions: [] });
  const page = await context.newPage();

  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();

  await expect(page.locator('.hud__signal')).toContainText(/refused|no location/i, {
    timeout: 25_000,
  });
  // The map is still usable. The game does not end because the sky is closed.
  await expect(page.getByRole('button', { name: 'Withdraw' })).toBeVisible();
  await context.close();
});

test('the ley-line draws itself as the player walks', async ({ page }) => {
  await openMap(page);
  await walk(page, 4);

  // The trail is one GeoJSON source updated in place, so the assertion is on the
  // data rather than on pixels: a screenshot cannot tell a line from a glow.
  await expect
    .poll(() => trailPointCount(page), { timeout: 45_000 })
    .toBeGreaterThan(1);
});

test('the trail is one source and two layers, however far you walk', async ({ page }) => {
  // v2 added a marker per step and ended up capping how much it would draw.
  await openMap(page);
  await walk(page, 4);

  const layers = await page.evaluate(() => {
    const map = (
      globalThis as unknown as { __esMap?: { getStyle: () => { layers: Array<{ id: string }> } } }
    ).__esMap;
    return map?.getStyle().layers.filter((l) => l.id.startsWith('leyline')).length ?? 0;
  });
  expect(layers).toBe(2);
});

test('the walk survives a reload and continues the same run', async ({ page }) => {
  await openMap(page);
  await walk(page, 4);
  await expect.poll(() => trailPointCount(page), { timeout: 45_000 }).toBeGreaterThan(1);
  const before = await trailPointCount(page);

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  // Restored from IndexedDB, and from the same run — a reload mid-walk must not open
  // a second one, or a loop closed afterwards would cover half the ground walked.
  await expect.poll(() => trailPointCount(page), { timeout: 45_000 }).toBeGreaterThanOrEqual(
    before,
  );
});

test('distance accumulates and is shown', async ({ page }) => {
  await openMap(page);
  await walk(page, 4);

  await expect
    .poll(async () => (await page.locator('.hud__value').nth(1).innerText()).trim(), {
      timeout: 45_000,
    })
    .toMatch(/\d+\s*m|\d+\.\d+\s*km/);
});

test('works with no tiles — airplane mode is a supported state', async ({ page }) => {
  await page.route(`**://${TILE_HOST}/**`, (route) => route.abort());

  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  await walk(page, 4);
  await expect.poll(() => trailPointCount(page), { timeout: 45_000 }).toBeGreaterThan(1);
});
