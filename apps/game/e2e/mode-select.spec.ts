import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';

/**
 * BRDC-MODE-001 — choosing between Route mode and Adventure mode, once, before the
 * Hearth, and the gating that choice drives on the map screen.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

// Route mode starts with sharing on and publishes by itself (BRDC-SEASON-001) — not to
// the live world from a test.
test.beforeEach(async ({ page }) => {
  await page.route('**/submit', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
});

test('the mode-select screen appears before the Hearth, and offers both paths', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the Awakening' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Your Path' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin the Adventure' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin the Route' })).toBeVisible();
});

test('route mode hides the Keep, Research and the sanctuary’s own ceremony', async ({ page }) => {
  await open(page, HERE, '.es-player__core', 'route');

  // The nav bar keeps its five columns (Sigil screen 02); Keep and Research are
  // disabled rather than removed, the same convention "Here" already uses when there
  // is nothing underfoot yet.
  await expect(page.getByRole('button', { name: 'Keep', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Research', exact: true })).toBeDisabled();

  // The walking sheet says what it is instead of a level that never moves.
  await expect(page.locator('.hud__label').filter({ hasText: 'Route' })).toBeVisible();
  await expect(page.locator('.hud__xp')).toHaveCount(0);

  // The destination grid's own accessible name is its name and subtitle together
  // (SettingsMenu's `link()`), so the subtitle — unique per card — is what a test
  // targets rather than the ambiguous short name ("Clan" is also inside "Clan Codex").
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Challenge a friend' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Join or start a friend circle' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Clans measured against each other' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Kingdoms retired' })).toHaveCount(0);

  // BRDC-MODE-002: the Codex of Dominion measures consciousness and works, neither of
  // which a route-mode save ever earns — it gets its own Route Ledger instead.
  await expect(page.getByRole('button', { name: 'Where you stand' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Distance and hexes measured' })).toBeVisible();
});

test('adventure mode is unchanged: Keep and Research stay reachable', async ({ page }) => {
  await open(page, HERE, '.es-player__core', 'adventure');

  await expect(page.getByRole('button', { name: 'Keep', exact: true })).toBeEnabled();
  await expect(page.locator('.hud__label').filter({ hasText: 'Consciousness' })).toBeVisible();
  await expect(page.locator('.hud__xp')).toBeVisible();

  await page.getByRole('button', { name: 'Menu' }).click();
  // The Wager is parked (BRDC-CLAIM-017) regardless of mode, not an adventure-only thing.
  await expect(page.getByRole('button', { name: 'Challenge a friend' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Join or start a friend circle' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Where you stand' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Distance and hexes measured' })).toHaveCount(0);
});

test('the Route Ledger ranks by distance, in the walker’s own units', async ({ page }) => {
  // BRDC-MODE-002: a flat ranking, not the Codex of Dominion's seven measures — this
  // is the table `routeCodexOf` builds, served from `/route-codex`.
  const table = {
    v: 1,
    generatedAt: Date.now(),
    players: 2,
    ranked: [
      { id: 'rival', name: 'Farwalker', distanceM: 12_400, hexes: 31 },
      { id: 'me', name: 'me', distanceM: 3_200, hexes: 9 },
    ],
  };
  await page.route('**/route-codex', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(table) }),
  );
  await open(page, HERE, '.es-player__core', 'route');

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Distance and hexes measured' }).click();

  const ledger = page.getByRole('region', { name: 'Route Ledger' });
  await expect(ledger).toBeVisible();
  await expect(ledger).toContainText('2 walkers measured');
  await expect(ledger).toContainText('Farwalker');
  await expect(ledger).toContainText('12.4 km');
  await expect(ledger).toContainText('31 hexes');

  await page.keyboard.press('Escape');
  await expect(ledger).toHaveCount(0);
});

test('the Route Ledger says so when nobody has published yet', async ({ page }) => {
  await page.route('**/route-codex', (route) => route.fulfill({ status: 204 }));
  await open(page, HERE, '.es-player__core', 'route');

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Distance and hexes measured' }).click();

  const ledger = page.getByRole('region', { name: 'Route Ledger' });
  await expect(ledger).toContainText(/No route has published yet/i, { timeout: 10_000 });
});
