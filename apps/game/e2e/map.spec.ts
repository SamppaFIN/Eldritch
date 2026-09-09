import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { acceptHearth, openMap as open } from './hearth.js';

/**
 * BRDC-MAP-001. The GREEN criteria from the ticket, asserted against a real browser.
 *
 * Statue of the Boy, Tampere — where v2's quest began.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 12 };
const TILE_HOST = 'tiles.openfreemap.org';

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

/** The live map's centre and zoom, read off the global the app exposes for tests. */
function mapState(page: Page): Promise<{ lng: number; lat: number; zoom: number }> {
  return page.evaluate(() => {
    const m = (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
    const c = m.getCenter();
    return { lng: c.lng, lat: c.lat, zoom: m.getZoom() };
  });
}

/**
 * Move the camera by hand. A firm drag from the right edge is unambiguously a pan (well
 * past MapLibre's 3 px click tolerance), so it fires dragstart with an originalEvent and
 * is never taken for a cell tap. Escape clears anything a stray event may have opened.
 */
async function panByHand(page: Page) {
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

/**
 * A drag on this dense map can also land a tap. Close the cell sheet the way a player
 * would, so it is not left covering a control on a narrow screen.
 */
async function closeCellSheet(page: Page) {
  const sheet = page.locator('.cell-panel');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await sheet.isVisible().catch(() => false))) return;
    await page.locator('.cell-panel__close').click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(300);
  }
  await expect(sheet).toBeHidden();
}

/** How far the player marker sits from the viewport centre, in pixels. */
async function markerOffset(page: Page): Promise<number> {
  const core = await page.locator('.es-player__core').boundingBox();
  const view = page.viewportSize();
  const cx = (core?.x ?? 0) + (core?.width ?? 0) / 2;
  const cy = (core?.y ?? 0) + (core?.height ?? 0) / 2;
  return Math.hypot(cx - (view?.width ?? 0) / 2, cy - (view?.height ?? 0) / 2);
}

/** Open the map and wait out the one-time founding tour, which drives the camera itself. */
async function openMapSettled(page: Page) {
  await openMap(page);
  // Land a fix on the map's own watch — Playwright only delivers to a watcher on a fresh
  // set, so without this the camera has no player position to follow.
  await page.context().setGeolocation({ ...HERE, latitude: HERE.latitude + 0.00001 });
  await page.context().setGeolocation(HERE);
  await expect.poll(() => markerOffset(page), { timeout: 15_000 }).toBeLessThan(6);
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
  // The Hearth needs the sky, not the streets, so it works with no tiles at all.
  await acceptHearth(page, HERE);

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

const flashOpacity = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const m = (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap;
    if (!m.getLayer('standing-flash-line')) return -1;
    return (m.getPaintProperty('standing-flash-line', 'line-opacity') as number) ?? -1;
  });

test('a reload brings the camera back to the player (BRDC-MAP-006)', async ({ page }) => {
  // Field report: after a refresh the map sat somewhere else. `useInitialPosition` asks
  // getCurrentPosition where to open the camera; when that times out — routinely, on a
  // cold high-accuracy fix — it opens on the Tampere fallback instead, and the first fix
  // from the watch has to fetch it back. Forcing getCurrentPosition to fail reproduces
  // exactly that split: the camera opens on the fallback, the player is elsewhere.
  await openMapSettled(page);

  await page.addInitScript(() => {
    const geo = navigator.geolocation;
    geo.getCurrentPosition = (_ok, fail) => {
      fail?.({ code: 3, message: 'timeout', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    };
  });
  // ~2 km north-east of the fallback: far enough that the camera is visibly wrong.
  const away = { latitude: HERE.latitude + 0.018, longitude: HERE.longitude + 0.018, accuracy: 12 };
  await page.context().setGeolocation(away);

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  // Land a fix on the reloaded page's own watch (Playwright only delivers on a fresh set).
  await page.context().setGeolocation({ ...away, latitude: away.latitude + 0.00001 });
  await page.context().setGeolocation(away);

  await expect.poll(() => markerOffset(page), { timeout: 8_000 }).toBeLessThan(8);
});

test('a hand pan unpins the camera — the next fix does not snap it back (BRDC-MAP-004)', async ({
  page,
}) => {
  await openMapSettled(page);
  await expect(page.getByRole('button', { name: 'Camera follows you' })).toBeVisible();

  await panByHand(page);
  // The button's own label is a direct read of the follow state: it flipped.
  await expect(page.getByRole('button', { name: 'Recenter the map on you' })).toBeVisible();

  // A fix ~130 m away. A following camera would chase it and re-centre the marker; an
  // unpinned one leaves the marker where the player walked off to.
  await page
    .context()
    .setGeolocation({ latitude: HERE.latitude + 0.0012, longitude: HERE.longitude + 0.0012, accuracy: 12 });
  await expect.poll(() => markerOffset(page), { timeout: 4_000 }).toBeGreaterThan(25);
});

test('the recenter button pins the camera back on the player (BRDC-MAP-004)', async ({ page }) => {
  await openMapSettled(page);

  await panByHand(page);
  await closeCellSheet(page);
  const recenter = page.getByRole('button', { name: 'Recenter the map on you' });
  await expect(recenter).toBeVisible();
  expect((await recenter.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

  await recenter.click();
  // Pinned again, by its label and by the marker returning to centre.
  await expect(page.getByRole('button', { name: 'Camera follows you' })).toBeVisible();
  await expect.poll(() => markerOffset(page), { timeout: 5_000 }).toBeLessThan(8);
});

test('Here flies to the cell underfoot at walking zoom, and flashes its edge (BRDC-MAP-004)', async ({
  page,
}) => {
  await openMapSettled(page);

  await page.evaluate(() =>
    (window as unknown as { __esMap: import('maplibre-gl').Map }).__esMap.setZoom(12.5),
  );
  await panByHand(page);
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: 'Here', exact: true }).click();

  // The flash layer is created the instant Here is pressed...
  await expect.poll(() => flashOpacity(page), { timeout: 3_000 }).toBeGreaterThan(0);

  // ...the camera flew back to walking zoom...
  await expect.poll(() => mapState(page).then((s) => s.zoom), { timeout: 3_000 }).toBeGreaterThan(15.4);

  // ...and the flash fades itself out.
  await expect.poll(() => flashOpacity(page), { timeout: 3_000 }).toBeLessThan(0.05);
});

test('the menu reaches Retreat, thumb-sized and focusable, and it asks first', async ({ page }) => {
  // Retreat lives behind the ☰ Menu — real button, real name, real size — not on the
  // walking bar itself. The confirmation flow itself is covered in dialogs.spec.ts.
  await openMap(page);
  const menu = page.getByRole('button', { name: 'Menu' });

  const box = await menu.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  await menu.focus();
  await expect(menu).toBeFocused();
  await menu.click();

  await page.getByRole('button', { name: 'Retreat from the map' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Withdraw' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
