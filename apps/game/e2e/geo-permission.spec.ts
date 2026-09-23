import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * BRDC-GEO-001 — a browser that never answers the location prompt at all.
 *
 * Split out of `map.spec.ts`, which was at its line ceiling: this describe block is
 * fully self-contained (its own permission context, its own boot helper) and does not
 * share fixtures with anything else in that file.
 */
test.describe('a browser that never answers (BRDC-GEO-001)', () => {
  // No geolocation permission at all, so nothing here can lean on a granted fix.
  test.use({ permissions: [] });

  /**
   * Straight to the map, past the Hearth flow.
   *
   * `acceptHearth` needs real fixes to nudge, and these tests are precisely about there
   * being none — so the Hearth is seeded the way the game itself stores it and `begin()`
   * routes to the map. `stub` replaces geolocation before any app code runs.
   */
  async function openWith(page: Page, stub: () => void) {
    await page.addInitScript(stub);
    await page.addInitScript(() => {
      // Mode (BRDC-MODE-001) seeded the same way as the Hearth below — straight to the
      // map, past a screen this test is not about.
      localStorage.setItem('es3:mode', JSON.stringify({ v: 1, d: { mode: 'adventure' } }));
      localStorage.setItem(
        'es3:hearth',
        JSON.stringify({ v: 1, d: { position: { lat: 61.4729, lng: 23.7259 }, at: Date.now() } }),
      );
    });
    await page.goto('/');
    await page.getByRole('button', { name: /begin|enter/i }).click();
  }

  test('the map still opens, rather than listening forever', async ({ page }) => {
    /*
     * The iPhone bug, reproduced. `getCurrentPosition` is allowed to call neither
     * callback, and on iOS it routinely does: the spec's own `timeout` clock does not
     * start until permission is granted, so an unanswered prompt or Location Services
     * switched off for Safari leaves the page waiting forever. `settled` never turned
     * true, MapView stayed on "Listening for the ground beneath you…", and tracking never
     * started because it is gated on `settled`. One unanswered callback bricked the game.
     */
    await openWith(page, () => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          // Neither callback, ever — exactly what WebKit does here.
          getCurrentPosition: () => {},
          watchPosition: () => 1,
          clearWatch: () => {},
        },
      });
    });

    // The deadline is ours, not the browser's: 8 s plus a second of slack.
    await expect(page.getByRole('region', { name: 'Map' })).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('.mapview--waiting')).toHaveCount(0);
  });

  test('and says what to do about it instead of just going quiet', async ({ page }) => {
    await openWith(page, () => {
      const refuse = (_ok: unknown, no?: (e: unknown) => void) => {
        no?.({ code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3 });
      };
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: refuse,
          watchPosition: (ok: unknown, no?: (e: unknown) => void) => {
            refuse(ok, no);
            return 1;
          },
          clearWatch: () => {},
        },
      });
    });

    // A refusal is a decision that can be reversed, so the notice names where the switch
    // is — on iOS it is two menus deep and no page can see or ask about the outer one.
    const advice = page.locator('.mapview__warning', { hasText: /Location Services/ });
    await expect(advice).toBeVisible({ timeout: 25_000 });
  });
});
