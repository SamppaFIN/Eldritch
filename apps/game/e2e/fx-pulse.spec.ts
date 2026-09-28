import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';
import { seedRealm } from './seedRealm.js';

/**
 * BRDC-FX-003 — the map animates only where something needs looking at. Counted in
 * MapLibre `render` events over a quiet stretch: a still map renders nothing.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function rendersOver(page: Page, ms: number): Promise<number> {
  return page.evaluate(
    (wait) =>
      new Promise<number>((resolve) => {
        const map = (globalThis as unknown as { __esMap: { on: (e: string, f: () => void) => void; off: (e: string, f: () => void) => void } }).__esMap;
        let n = 0;
        const count = () => (n += 1);
        map.on('render', count);
        setTimeout(() => {
          map.off('render', count);
          resolve(n);
        }, wait);
      }),
    ms,
  );
}

async function settle(page: Page) {
  await page.waitForFunction(() => Boolean((globalThis as unknown as { __esMap?: unknown }).__esMap));
  await page.waitForTimeout(12_000);
  await page.locator('.unlock__card').getByRole('button', { name: 'Not now' }).click({ timeout: 1_000 }).catch(() => undefined);
  await page.waitForTimeout(2_000);
}

test('ground in good heart: the map sits still', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page, HERE);
  await settle(page);
  expect(await rendersOver(page, 3_000)).toBeLessThan(5);
});

test('fading ground pulses, and only while it is on screen', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  // Twelve days unwalked at base strength: inside the 48-hour fading window.
  await seedRealm(page, { at: HERE, rings: 3, strength: 100, visitedAgoMs: 12 * 86_400_000 });
  await page.reload();
  await settle(page);
  expect(await rendersOver(page, 3_000)).toBeGreaterThan(10);
});

test('reduced motion: fading ground does not pulse', async ({ page }) => {
  test.setTimeout(150_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMap(page, HERE);
  await seedRealm(page, { at: HERE, rings: 3, strength: 100, visitedAgoMs: 12 * 86_400_000 });
  await page.reload();
  await settle(page);
  expect(await rendersOver(page, 3_000)).toBeLessThan(5);
});
