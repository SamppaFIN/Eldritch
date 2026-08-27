import { expect, test } from '@playwright/test';

/**
 * BRDC-MAP-001. The GREEN criteria from the ticket, asserted against a real browser.
 *
 * Statue of the Boy, Tampere — where v2's quest began.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 12 };
const TILE_HOST = 'tiles.openfreemap.org';

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
}

test('renders the map and places the player on it', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.hud__signal')).toContainText(/Signal/i, { timeout: 20_000 });
});

test('the player marker sits exactly on the camera centre', async ({ page }) => {
  // A marker half its own width off true is the kind of thing nobody notices until
  // the territory it anchors is a hexagon out of place.
  await openMap(page);
  const core = await page.locator('.es-player__core').boundingBox();
  const view = page.viewportSize();

  expect(core).not.toBeNull();
  expect(view).not.toBeNull();
  const cx = (core?.x ?? 0) + (core?.width ?? 0) / 2;
  const cy = (core?.y ?? 0) + (core?.height ?? 0) / 2;

  expect(Math.abs(cx - (view?.width ?? 0) / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(cy - (view?.height ?? 0) / 2)).toBeLessThanOrEqual(1);
});

test('the accuracy ring is drawn to scale, not to a whim', async ({ page }) => {
  // 12 m accuracy is a 24 m circle; at zoom 16 and 61°N that is roughly 21 px.
  // The bug this guards against drew it 256x too large and filled the screen.
  await openMap(page);
  const ring = await page.locator('.es-player__accuracy').boundingBox();
  expect(ring?.width ?? 0).toBeGreaterThan(15);
  expect(ring?.width ?? 0).toBeLessThan(80);
});

test('actually fetches vector tiles — the worker is alive', async ({ page }) => {
  // MapLibre parses tiles in a Web Worker. When the worker fails to load, everything
  // still looks fine — style loads, TileJSON loads, no error is raised — and not one
  // tile is ever requested. This asserts the thing that silence hides.
  const tiles: string[] = [];
  page.on('response', (r) => {
    if (r.url().endsWith('.pbf')) tiles.push(r.url());
  });

  await openMap(page);
  await expect.poll(() => tiles.length, { timeout: 20_000 }).toBeGreaterThan(0);
});

test('contacts the tile host and nothing else', async ({ page }) => {
  const foreign = new Set<string>();
  page.on('request', (r) => {
    const host = new URL(r.url()).hostname;
    if (host && host !== 'localhost' && host !== TILE_HOST) foreign.add(host);
  });

  await openMap(page);
  await page.waitForTimeout(2_000);
  expect([...foreign]).toEqual([]);
});

test('survives with no tiles at all', async ({ page }) => {
  // Phase 1's gate is a ten-minute walk in airplane mode, so this is a supported
  // state rather than an error: the streets go, the game stays.
  await page.route(`**://${TILE_HOST}/**`, (route) => route.abort());

  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();

  await expect(page.locator('.hud__note')).toContainText(/streets are unreachable/i, {
    timeout: 20_000,
  });
  await expect(page.locator('.es-player__core')).toBeVisible();
});

test('does not scroll sideways on a phone', async ({ page }) => {
  await openMap(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the withdraw control is a real button, thumb-sized and focusable', async ({ page }) => {
  await openMap(page);
  const withdraw = page.getByRole('button', { name: 'Withdraw' });

  const box = await withdraw.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  await withdraw.focus();
  await expect(withdraw).toBeFocused();
  await withdraw.click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
