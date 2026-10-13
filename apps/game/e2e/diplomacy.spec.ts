import { expect, test } from '@playwright/test';
import { cellAt, cellCentre } from '@es3/core/geo';
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
// The quay hex's own centre, worked out here rather than by loading h3-js from a CDN in the page.
const QUAY_CENTRE = cellCentre(cellAt(QUAY));

test.use({ permissions: ['geolocation'], geolocation: HERE });

/**
 * Walk to `at` and open the hex underfoot.
 *
 * This used to free the camera, put the quay under the crosshair and tap it. Fog of war
 * draws only your own ground and its ring now, so a village 270 m away is not on the map
 * to be tapped — and reaching a city state was always meant to be a walk to a place. The
 * wait keeps the jump under `MAX_SPEED_MS`, so the fix is accepted, not rejected as a
 * teleport.
 */
async function walkTo(page: Page, at: { lat: number; lng: number }) {
  await page.waitForTimeout(45_000);
  await page.context().setGeolocation({ latitude: at.lat, longitude: at.lng, accuracy: 8 });
  const card = page.getByRole('region', { name: 'Selected cell' });
  // "Here" opens the hex underfoot once the fix has landed; retry until it is the village's.
  await expect(async () => {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Here', exact: true }).click();
    await expect(card).toContainText('Härmälänranta', { timeout: 3_000 });
  }).toPass({ timeout: 40_000 });
  return card;
}

test('the village is on the map, named, and holds for good', async ({ page }) => {
  test.setTimeout(200_000);
  await open(page, HERE);
  const card = await walkTo(page, QUAY_CENTRE);

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
  // One hex south of the quay: inside the village, and not its door.
  const card = await walkTo(page, { lat: QUAY_CENTRE.lat - 45 / 111_320, lng: QUAY_CENTRE.lng });
  await expect(card).toContainText(/quay is .* from here|quay is the next hex/);
});
