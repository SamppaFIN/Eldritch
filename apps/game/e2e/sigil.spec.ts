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
