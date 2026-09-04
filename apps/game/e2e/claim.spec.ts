import { expect, test } from '@playwright/test';
import { enableLoopClosure, openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-CLAIM-005, CLAIM-006 and HUD-002.
 *
 * Phase 2's gate in the form a browser can run: walk a block, watch it fill.
 * The outdoor half — tomorrow reinforces, twenty days releases — is the dev time
 * machine's job and is exercised through the clock rather than by waiting.
 *
 * BRDC-CLAIM-009 defaulted loop closure off — territory grows by stepping now — so
 * this whole file switches it back on: it is the loop's own coverage.
 */
const START = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
const BLOCK_M = 140;
const STEP_MS = 5_300;

const dLat = (m: number) => m / 111_320;
const dLng = (m: number) => m / 53_000;

test.use({ permissions: ['geolocation'], geolocation: START });

async function openMap(page: Page) {
  await enableLoopClosure(page);
  await open(page, START);
}

/** Walk one lap of a square block, four fixes per side. */
async function walkBlock(page: Page) {
  const legs: Array<[number, number]> = [];
  const q = BLOCK_M / 4;
  for (let i = 1; i <= 4; i++) legs.push([dLat(q * i), 0]);
  for (let i = 1; i <= 4; i++) legs.push([dLat(BLOCK_M), dLng(q * i)]);
  for (let i = 1; i <= 4; i++) legs.push([dLat(BLOCK_M - q * i), dLng(BLOCK_M)]);
  for (let i = 1; i <= 4; i++) legs.push([0, dLng(BLOCK_M - q * i)]);

  for (const [lat, lng] of legs) {
    await page.context().setGeolocation({
      latitude: START.latitude + lat,
      longitude: START.longitude + lng,
      accuracy: 8,
    });
    await page.waitForTimeout(STEP_MS);
  }
  // One batch window plus a margin, so the closing fix has been submitted.
  await page.waitForTimeout(13_000);
}

async function cellsOnMap(page: Page): Promise<number> {
  return page.evaluate(() => {
    const map = (
      globalThis as unknown as {
        __esMap?: {
          getSource: (id: string) => { serialize?: () => { data?: unknown } } | undefined;
        };
      }
    ).__esMap;
    const data = map?.getSource('cells')?.serialize?.().data as
      | { features?: unknown[] }
      | undefined;
    return data?.features?.length ?? 0;
  });
}

test('walking a block claims the ground inside it', async ({ page }) => {
  test.setTimeout(180_000);
  await openMap(page);
  await walkBlock(page);

  // The HUD is the player's evidence that anything happened at all.
  await expect(page.locator('.hud__claim')).toContainText(/awakened/i, { timeout: 30_000 });

  const warded = page.locator('.hud__value').nth(2);
  await expect(warded).not.toHaveText(/^0/);

  // And the hexagons are actually drawn, not merely counted.
  expect(await cellsOnMap(page)).toBeGreaterThan(0);
});

test('the claim survives whatever the batch timing does', async ({ page }) => {
  // Regression guard. Two versions of this lost a completed lap silently: one dropped
  // a closure attempt that arrived while another was in flight, and one cancelled the
  // in-flight attempt on cleanup — after closeLoop had already written. The ground was
  // taken, XP was paid, and the HUD went on showing zero.
  test.setTimeout(180_000);
  await openMap(page);
  await walkBlock(page);

  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('es3', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const all = await new Promise<unknown[]>((resolve) => {
      const request = db.transaction('kv', 'readonly').objectStore('kv').getAll();
      request.onsuccess = () => resolve(request.result);
    });
    const profile = all.find(
      (v): v is { id: string; xp: number } =>
        typeof v === 'object' && v !== null && 'colorHue' in v,
    );
    const mine = all.filter(
      (v): v is { ownerId: string } =>
        typeof v === 'object' && v !== null && 'ownerId' in v &&
        (v as { ownerId: string }).ownerId === profile?.id,
    );
    return { xp: profile?.xp ?? 0, owned: mine.length };
  });

  expect(stored.owned).toBeGreaterThan(0);
  expect(stored.xp).toBeGreaterThan(0);

  // What is on disk must be what is on screen. The whole bug was these two disagreeing.
  const warded = await page.locator('.hud__value').nth(2).innerText();
  expect(Number.parseInt(warded, 10)).toBe(stored.owned);
});

test('a walk that encloses nothing claims no interior', async ({ page }) => {
  /*
   * Out and back along one line. It ends where it started, so a proximity test would
   * hand over territory for a trip to the shop.
   *
   * Since BRDC-GROW-001 the walk does take the cells it physically crossed — that is the
   * point of adjacency growth, and most walks close nothing. What must not happen is a
   * *claim*: no loop, no interior, no burst.
   */
  test.setTimeout(180_000);
  await openMap(page);

  for (let i = 1; i <= 6; i++) {
    await page.context().setGeolocation({
      latitude: START.latitude + dLat(30 * i),
      longitude: START.longitude,
      accuracy: 8,
    });
    await page.waitForTimeout(STEP_MS);
  }
  for (let i = 5; i >= 0; i--) {
    await page.context().setGeolocation({
      latitude: START.latitude + dLat(30 * i),
      longitude: START.longitude,
      accuracy: 8,
    });
    await page.waitForTimeout(STEP_MS);
  }
  await page.waitForTimeout(13_000);

  // No loop closed, so no claim was announced.
  await expect(page.locator('.hud__claim')).toHaveCount(0);

  /*
   * And no interior was taken. The line itself is a handful of cells wide; the area a
   * 180-metre loop would enclose is dozens. The bound is what separates "walked over"
   * from "claimed inside".
   */
  const warded = Number.parseInt(await page.locator('.hud__value').nth(2).innerText(), 10);
  expect(warded).toBeLessThan(20);
});

test('the number of territory layers does not grow with how much is claimed', async ({ page }) => {
  // BRDC-SCALE-001: the count itself (eight, as of the terrain glyph, the Work mark,
  // the banner flag and the anomaly mark) is not the point and will keep moving as
  // features land — pinning it is what made this test go stale before. The point,
  // unchanged since CLAIM-006, is that claiming does not add layers: one GeoJSON
  // source, redrawn, never one layer per cell — the exact thing v2 got wrong with
  // thousands of DOM markers and a cap on how much it would draw.
  test.setTimeout(180_000);
  await openMap(page);

  const countLayers = () =>
    page.evaluate(() => {
      const map = (
        globalThis as unknown as { __esMap?: { getStyle: () => { layers: Array<{ id: string }> } } }
      ).__esMap;
      return map?.getStyle().layers.filter((l) => l.id.startsWith('cells-')).length ?? 0;
    });

  const before = await countLayers();
  expect(before).toBeGreaterThan(0);

  await walkBlock(page);

  expect(await countLayers()).toBe(before);
});

test('claimed ground survives a reload', async ({ page }) => {
  test.setTimeout(180_000);
  await openMap(page);
  await walkBlock(page);

  const before = await page.locator('.hud__value').nth(2).innerText();
  expect(Number.parseInt(before, 10)).toBeGreaterThan(0);

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  await expect
    .poll(async () => Number.parseInt(await page.locator('.hud__value').nth(2).innerText(), 10), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
});

test('five thousand hexagons do not stall the main thread', async ({ page }) => {
  // CLAIM-006. An evening of walking is a few hundred cells; five thousand is a
  // month of them, and the reason this is cheap is that it is one GeoJSON source
  // rather than five thousand DOM nodes.
  //
  // BRDC-SCALE-001's audit of this test: it timed only the synchronous setData() call,
  // never waited for the map to actually finish drawing (`idle`), and left every symbol
  // layer empty — cells-icon, the most text-shaping-heavy of the eight `cells-*` layers,
  // never rendered a single glyph. All three are fixed below: every cell carries an
  // icon, and the clock runs until MapLibre says it is done, not until setData returns.
  test.setTimeout(120_000);
  await openMap(page);

  const elapsed = await page.evaluate(async () => {
    const map = (
      globalThis as unknown as {
        __esMap?: {
          getSource: (id: string) => { setData?: (d: unknown) => void };
          getCenter: () => { lat: number; lng: number };
          once: (event: 'idle', cb: () => void) => void;
        };
      }
    ).__esMap;
    if (!map) return -1;

    const c = map.getCenter();
    // A rough hex lattice; the exact geometry does not matter, the count does. Every
    // property the eight cells-* layers read is present, so all of them draw — not
    // just fill and line.
    const features = Array.from({ length: 5000 }, (_, i) => {
      const row = Math.floor(i / 70);
      const col = i % 70;
      const lat = c.lat + row * 0.00035;
      const lng = c.lng + col * 0.0007 + (row % 2) * 0.00035;
      const r = 0.00018;
      const ring = Array.from({ length: 7 }, (_, k) => {
        const a = (Math.PI / 3) * k;
        return [lng + r * Math.cos(a) * 2, lat + r * Math.sin(a)];
      });
      return {
        type: 'Feature',
        properties: {
          strength: 100,
          mine: true,
          contested: false,
          color: '#4a1a5c',
          icon: '♣',
          iconColor: '#00d4ff',
          building: '',
          buildingColor: '',
          flag: '',
          anomaly: '',
          blight: 0,
        },
        geometry: { type: 'Polygon', coordinates: [ring] },
      };
    });

    const started = performance.now();
    map.getSource('cells')?.setData?.({ type: 'FeatureCollection', features });
    await new Promise<void>((resolve) => map.once('idle', resolve));
    return performance.now() - started;
  });

  expect(elapsed).toBeGreaterThanOrEqual(0);
  // Generous next to the old 400 ms: that budget only ever covered handing the data to
  // the worker, not the symbol layout and paint that now run inside the window too — and
  // this file's other tests are real GPS walks, so a parallel run shares the CPU with them.
  expect(elapsed).toBeLessThan(6_000);

  await expect(page.locator('.es-player__core')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeEnabled();
});

test('per-cell strokes are dropped when zoomed out', async ({ page }) => {
  // Below zoom 13 a res-11 cell is smaller than a fingertip, so the strokes stop
  // being information and become cost.
  await openMap(page);

  const minzooms = await page.evaluate(() => {
    const map = (
      globalThis as unknown as {
        __esMap?: { getStyle: () => { layers: Array<{ id: string; minzoom?: number }> } };
      }
    ).__esMap;
    return (map?.getStyle().layers ?? [])
      .filter((l) => l.id.startsWith('cells-'))
      .map((l) => [l.id, l.minzoom ?? 0] as const);
  });

  const byId = new Map(minzooms);
  expect(byId.get('cells-fill')).toBe(0);
  expect(byId.get('cells-line')).toBe(13);
  expect(byId.get('cells-contested')).toBe(13);
});
