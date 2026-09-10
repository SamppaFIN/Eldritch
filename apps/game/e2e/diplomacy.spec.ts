import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-DIPLO-001 — the fishing village at Härmälänranta, and trading at its quay.
 *
 * Diplomacy happens at one hex rather than from a menu, so reaching a city state is a
 * walk to a place. That is also what makes this spec fiddly: the camera is pinned to the
 * player, so it has to be freed before the map can be taken anywhere else.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
const QUAY = { lat: 61.4753, lng: 23.7272 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

/**
 * Free the camera, put the quay under the crosshair, and tap it.
 *
 * The recenter button only ever *pins* — the camera is unpinned by a real drag, which is
 * why this pans by hand first (`useCameraFollow`). Without that, `jumpTo` is undone by the
 * follow animation within a second and the tap lands back on the player's own hex.
 */
async function tapTheQuay(page: Page) {
  const vs = page.viewportSize();
  const sx = (vs?.width ?? 360) - 20;
  const sy = (vs?.height ?? 640) / 2;
  const unpinned = page.getByRole('button', { name: 'Recenter the map on you' });

  // A drag is the only thing that unpins, and on a dense map it does not always take —
  // the same retry `map.spec.ts` needs.
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

  // A drag on this map can also land a tap; clear the sheet before the real one.
  const sheet = page.locator('.cell-panel');
  for (let attempt = 0; attempt < 3 && (await sheet.isVisible().catch(() => false)); attempt += 1) {
    await page.locator('.cell-panel__close').click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(300);
  }

  /*
   * Centre the quay and tap it. The camera eases back to the player while it is pinned,
   * so the tap must not wait for an animation to undo the jump — and a hex is a small
   * target, so a miss lands on a neighbour of the quay rather than the quay itself. Both
   * are why this retries rather than asserting on one shot.
   */
  const canvas = page.locator('.maplibregl-canvas');
  const box = await canvas.boundingBox();
  const cx = (box?.width ?? 640) / 2;
  const cy = (box?.height ?? 400) / 2;
  /*
   * A res-11 hex is about 45 m across, which at zoom 18 is roughly seventy pixels — so a
   * miss has to be corrected by tens of pixels, not by six. This walks the quay's own hex
   * and its six neighbours until the trade panel appears.
   */
  const R = 70;
  const nudges = [
    { x: 0, y: 0 },
    { x: R, y: 0 },
    { x: -R, y: 0 },
    { x: R / 2, y: R },
    { x: -R / 2, y: R },
    { x: R / 2, y: -R },
    { x: -R / 2, y: -R },
  ];

  for (const nudge of nudges) {
    // Clear the previous miss at the *start*, so the last attempt leaves its card open.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.evaluate(async (at: { lat: number; lng: number }) => {
      const h3 = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/h3-js@4.1.0/+esm');
      const [lat, lng] = h3.cellToLatLng(h3.latLngToCell(at.lat, at.lng, 11)) as [number, number];
      const map = (globalThis as unknown as {
        __esMap?: { jumpTo: (o: { center: [number, number]; zoom: number }) => void };
      }).__esMap;
      map?.jumpTo({ center: [lng, lat], zoom: 18 });
    }, QUAY);

    // The jump is synchronous but the frame it produces is not; let it land before tapping.
    await page.waitForTimeout(250);
    await canvas.click({ position: { x: cx + nudge.x, y: cy + nudge.y } });
    // Wait for *a* card before asking whether it is the quay — under load the tap and the
    // panel are far enough apart that checking straight away reads the previous state.
    await sheet.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => undefined);
    if (await page.locator('.trade').isVisible().catch(() => false)) break;
  }

  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 15_000 });
  return card;
}

test('the village is on the map, named, and holds for good', async ({ page }) => {
  test.setTimeout(200_000);
  await open(page, HERE);
  const card = await tapTheQuay(page);

  // Named, rather than the generic "Held by another" every rival gets.
  await expect(card).toContainText('Härmälänranta');
  // And no countdown: a clock on ground that cannot be lost is a lie with a number on it.
  await expect(card).toContainText(/Held for good/i);
  await expect(card).not.toContainText(/The Void takes it/i);
});

/*
 * The trade *interaction* is not here, deliberately.
 *
 * Diplomacy happens at one hex out of the village's nineteen, and landing a synthetic tap
 * on one specific res-11 cell is not reliable in this harness: the camera eases back to
 * the player unless it has been unpinned by a real drag, the drag does not always take,
 * and several browsers on one machine push every step past its timing. Three shapes of the
 * test were tried; each passed alone and failed under load, in different places.
 *
 * A flaky test is worse than an honest gap, so the swap is covered where it can be
 * covered exactly — `cityState.repo.test.ts` runs it through the real `MockRepository`:
 * the parcel is taken, the quarter is kept, a refusal writes nothing, and it only works
 * at the quay. What is left untested is the two chips and the button, and that is stated
 * in BRDC-DIPLO-001 rather than papered over.
 */

test('a village hex says where its quay is', async ({ page }) => {
  /*
   * A village is nineteen hexes and its quay is one of them. Without this the door is a
   * hunt — which is the same shape as every other "the content is there and the screen
   * does not show the way to it" bug fixed this week.
   */
  test.setTimeout(200_000);
  await open(page, HERE);
  await tapTheQuay(page);

  // Whichever hex of the village the tap landed on, it names the village — and if it is
  // not the quay, it says how far the quay is.
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toContainText('Härmälänranta');
  const onQuay = await page.locator('.trade').isVisible().catch(() => false);
  if (!onQuay) await expect(card).toContainText(/quay is .* from here|quay is the next hex/);
});
