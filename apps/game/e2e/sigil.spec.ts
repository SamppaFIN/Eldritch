import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-SIGIL-001 / -002 — the visual system, checked where it actually lives.
 *
 * Its own spec rather than more of `map.spec`: that file is about what the camera and the
 * geolocation do, and this is about what the game looks like. They fail for different
 * reasons and they are read by somebody asking a different question.
 *
 * The sprites are rasterised in the browser into MapLibre's own image atlas, so nothing
 * short of a real browser can say whether they arrived.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

/** The live map, read off the handle the app exposes for tests. */
function mapState<T>(page: Page, fn: (m: import('maplibre-gl').Map) => T): Promise<T> {
  return page.evaluate(
    (src) =>
      (new Function('m', `return (${src})(m)`) as (m: unknown) => T)(
        (window as unknown as { __esMap: unknown }).__esMap,
      ),
    fn.toString(),
  );
}

test('the ground is drawn as isometric tiles, not letters', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, HERE);

  // The tiles reached the atlas...
  await expect
    .poll(
      () =>
        mapState(page, (m) =>
          ['plain', 'forest', 'hill', 'lake', 'coast', 'market', 'mountain'].every((k) =>
            m.hasImage(`ground-${k}`),
          ),
        ),
      { timeout: 25_000 },
    )
    .toBe(true);

  // ...the layer that draws them is on...
  await expect
    .poll(() => mapState(page, (m) => m.getLayoutProperty('cells-ground', 'visibility')), {
      timeout: 15_000,
    })
    .toBe('visible');

  // ...and the glyph layer stood down, because two marks for one fact is the noise §12
  // warns about. It stays in the style as the no-canvas fallback, hidden rather than gone.
  expect(await mapState(page, (m) => m.getLayoutProperty('cells-icon', 'visibility'))).toBe('none');
});

/**
 * Claim and reveal a wide ring around the Hearth by writing straight into IndexedDB — the
 * same shortcut `lands.spec.ts` uses for the same reason: BRDC-CLAIM-014 makes a long
 * chain of sequential step-claims unreliable past a few legs, and finding a bounty should
 * not depend on walking around that bug. At radius 6 (127 cells) the chance every one of
 * them misses a bounty is 0.875^127, close enough to zero that a single reload is a fact
 * about this ground rather than a lucky run.
 */
async function seedRevealedRealm(page: Page, rings: number): Promise<number> {
  return page.evaluate(async (r: number) => {
    const h3 = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/h3-js@4.1.0/+esm');
    const home = h3.latLngToCell(61.47290805, 23.72588249, 11);
    const cells: string[] = h3.gridDisk(home, r);
    const now = Date.now();
    const me = await new Promise<string>((res) => {
      const req = indexedDB.open('es3');
      req.onsuccess = () => {
        const g = req.result.transaction('kv', 'readonly').objectStore('kv').get('profile');
        g.onsuccess = () => res((g.result as { id: string }).id);
      };
    });
    await new Promise<void>((res) => {
      const req = indexedDB.open('es3');
      req.onsuccess = () => {
        const tx = req.result.transaction('kv', 'readwrite');
        const st = tx.objectStore('kv');
        const revealed: Record<string, number> = {};
        for (const c of cells) {
          st.put(
            { h3: c, ownerId: me, strength: 300, lastVisitedAt: now, visitDays: [], ownedDays: 2 },
            `cell:${h3.cellToParent(c, 6)}:${c}`,
          );
          revealed[c] = now;
        }
        st.put(revealed, 'revealed');
        tx.oncomplete = () => res();
      };
    });
    return cells.length;
  }, rings);
}

/*
 * BRDC-SIGIL-003. "myös kartalle, paljastuksen jälkeen" — a found bounty stands on its
 * hex as a drawn thing once the reveal mechanic has actually paid it out.
 */
test('a revealed bounty stands on its own hex, drawn as a thing', async ({ page }) => {
  test.setTimeout(300_000);
  await open(page, HERE);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 25_000 });

  await seedRevealedRealm(page, 6);
  await page.reload();
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 25_000 });

  // The bounty icons landed in the atlas...
  await expect
    .poll(() => mapState(page, (m) => m.hasImage('bounty-wheat') || m.hasImage('bounty-fish')), {
      timeout: 20_000,
    })
    .toBe(true);

  // ...the layer that draws them is on...
  await expect
    .poll(() => mapState(page, (m) => m.getLayoutProperty('cells-bounty', 'visibility')), {
      timeout: 15_000,
    })
    .toBe('visible');

  // ...and at least one rendered cell actually carries a bounty — the ground, and only
  // the ground, told the layer what to draw.
  await expect
    .poll(
      () =>
        mapState(
          page,
          (m) =>
            m.querySourceFeatures('cells', { filter: ['!=', ['get', 'bounty'], ''] }).length,
        ),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);
});
