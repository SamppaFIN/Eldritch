import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * The Season — "Join the Weekly Tournament" publishes a player's own starting line,
 * and gains are read against it, day by day (BRDC-SEASON-001). Open to both modes,
 * unlike the Codex/Route Ledger split.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

// Joining turns sharing on, which publishes on its own — never let a test do that to the
// live world.
test.beforeEach(async ({ page }) => {
  await page.route('**/submit', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
});

async function openMap(page: Page) {
  await open(page, HERE);
}

async function openMenuAction(page: Page, label: string) {
  await page.getByRole('button', { name: 'Menu' }).click();
  const target = page.getByRole('button', { name: label });
  if (!(await target.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^Advanced/ }).click();
  }
  await target.click();
}

test('the Season ranks joined players by what they gained since joining', async ({ page }) => {
  // Two rivals who joined on different days — neither is the local player, whose real
  // id is a random UUID this test cannot predict; the local-player-joined states are
  // covered separately below.
  // The Worker lays each join beside the player's latest published figures — and name,
  // so a rename shows here without the join being redone.
  const joins = [
    {
      id: 'slow', name: 'Slowpoke', distanceM: 1_000, hexes: 5, joinedAt: Date.now() - 3 * 86_400_000,
      current: { distanceM: 1_500, hexes: 8 },
    },
    {
      id: 'rival', name: 'Farwalker Renamed', distanceM: 500, hexes: 2, joinedAt: Date.now() - 86_400_000,
      current: { distanceM: 4_500, hexes: 12 },
    },
  ];
  await page.route('**/season/joins', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ joins }) }),
  );

  await openMap(page);
  await openMenuAction(page, 'The Season Join the week');

  const season = page.getByRole('region', { name: 'The Season' });
  await expect(season).toBeVisible();

  // Farwalker gained 4 km and 10 hexes since their own join — ranked first.
  await expect(season).toContainText('Farwalker Renamed');
  await expect(season).toContainText('+4 km');
  await expect(season).toContainText('+10 hexes');
  // Slowpoke gained less (500 m, 3 hexes) and ranks second.
  await expect(season).toContainText('Slowpoke');
  await expect(season).toContainText('+500 m');

  await page.keyboard.press('Escape');
  await expect(season).toHaveCount(0);
});

test('the Season invites you to join when nobody has yet', async ({ page }) => {
  await page.route('**/season/joins', (route) => route.fulfill({ status: 204 }));
  await openMap(page);
  await openMenuAction(page, 'The Season Join the week');

  const season = page.getByRole('region', { name: 'The Season' });
  await expect(season).toContainText(/Nobody has joined yet/i, { timeout: 10_000 });
  await expect(season.getByRole('button', { name: 'Join the Weekly Tournament' })).toBeVisible();
});

test('joining publishes the player’s own current distance and hexes', async ({ page }) => {
  let posted: unknown = null;
  await page.route('**/season/joins', (route) => route.fulfill({ status: 204 }));
  await page.route('**/season/join', async (route) => {
    posted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await openMap(page);
  await openMenuAction(page, 'The Season Join the week');

  const season = page.getByRole('region', { name: 'The Season' });
  await season.getByRole('button', { name: 'Join the Weekly Tournament' }).click();

  await expect.poll(() => posted).not.toBeNull();
  // …and it greets them, with the line they joined at.
  await expect(season.getByRole('status', { name: 'Welcome' })).toContainText(/Welcome to the Weekly Tournament/);
  const body = posted as { id?: unknown; name?: unknown; distanceM?: unknown; hexes?: unknown };
  expect(typeof body.id).toBe('string');
  expect(typeof body.name).toBe('string');
  expect(typeof body.distanceM).toBe('number');
  expect(typeof body.hexes).toBe('number');
});

test('joining turns sharing on, publishes by itself, and a rename follows (BRDC-SEASON-001)', async ({ page }) => {
  test.setTimeout(120_000);
  const names: string[] = [];
  await page.route('**/submit', async (route) => {
    names.push((route.request().postDataJSON() as { name: string }).name);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.route('**/season/joins', (route) => route.fulfill({ status: 204 }));
  await page.route('**/season/join', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );

  await openMap(page);
  // Sharing is off by default, so nothing is published yet.
  await page.waitForTimeout(5_000);
  expect(names).toHaveLength(0);

  await openMenuAction(page, 'The Season Join the week');
  await page
    .getByRole('region', { name: 'The Season' })
    .getByRole('button', { name: 'Join the Weekly Tournament' })
    .click();

  // No button pressed — the realm goes out on its own shortly after.
  await expect.poll(() => names.length, { timeout: 20_000 }).toBeGreaterThan(0);
  const before = names.length;

  // A new name reaches the Worker on the next check, not ten minutes later.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'You', exact: true }).click();
  const you = page.getByRole('region', { name: 'You' });
  const field = you.getByRole('textbox').first();
  await field.fill('Renamed Seeker');
  await field.press('Enter');
  await expect
    .poll(() => names.slice(before).includes('Renamed Seeker'), { timeout: 60_000 })
    .toBe(true);
});
