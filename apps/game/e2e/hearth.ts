/**
 * Getting past the Hearth.
 *
 * The game now opens by asking the player to accept the ground they are standing on, and
 * it will not ask until the device has produced several fixes that agree. That is the
 * point of BRDC-HEARTH-001, and it is also a wall across every other spec in this
 * directory: "Begin the Awakening" no longer lands on the map.
 *
 * Playwright emits one position when a watch is registered and then only on change, so
 * the stability window never fills on its own. Nudging the location a metre at a time
 * produces real fixes through the real code path — more honest than lowering the bar the
 * screen exists to hold.
 */
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/** About a metre of latitude: well inside the agreement threshold, and not zero. */
const NUDGE = 0.00001;

export async function acceptHearth(page: Page, at: Coords): Promise<void> {
  /*
   * Wait for the screen before moving the player.
   *
   * The first version fired all five nudges the instant "Begin" was clicked — before
   * React had mounted the Hearth and registered its watch. Every one of them was
   * delivered to nobody, the device looked to the game like a single stationary fix, and
   * the button that only appears when the fixes agree never appeared at all.
   */
  await expect(page.getByRole('heading', { name: 'Your Hearth' })).toBeVisible({
    timeout: 15_000,
  });

  /*
   * Eight fixes, spaced. The stability window is four, so this clears it with room —
   * and the spacing is what makes them separate fixes rather than one coalesced move.
   *
   * Not a poll on the button: `isEnabled` waits for the element to attach, and the
   * enabled button does not exist until the fixes have already agreed, so polling it
   * spends a thirty-second timeout on every pass and blows the test budget.
   */
  for (let step = 1; step <= 8; step += 1) {
    await page.context().setGeolocation({ ...at, latitude: at.latitude + step * NUDGE });
    await page.waitForTimeout(250);
  }

  const accept = page.getByRole('button', { name: 'This ground is mine' });
  await expect(accept).toBeEnabled({ timeout: 20_000 });
  await accept.click();

  // Put the player back where the spec thinks they are. The nudges were five metres of
  // scaffolding, and a walk that starts five metres north of its own fixture drifts.
  await page.context().setGeolocation(at);
}

/** Title screen, Hearth, map — the whole opening, in the order a player meets it. */
export async function openMap(page: Page, at: Coords, ready = '.es-player__core'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await acceptHearth(page, at);
  await expect(page.locator(ready)).toBeVisible({ timeout: 20_000 });
}

/**
 * Switch on loop closure before the app boots — BRDC-CLAIM-009 defaulted it off, so a
 * spec written for "walk a lap, watch it fill" has to ask for it explicitly, the same
 * way a player would from the ☰ Menu. Call before `openMap`/`page.goto`, once per page:
 * `addInitScript` re-runs on every navigation that page makes afterwards, reload included.
 */
export async function enableLoopClosure(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const envelope = { v: 1, d: { sound: true, vibration: true, loopClosure: true } };
    window.localStorage.setItem('es3:settings', JSON.stringify(envelope));
  });
}
