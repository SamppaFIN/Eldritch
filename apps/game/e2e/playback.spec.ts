import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';
import { playRoute, stopPlayback } from './playback.js';

/**
 * BRDC-SIM-002 — a walked route played back through the live pipeline: the same filter,
 * the same trail, the same claims as a phone's own fixes, at ×60.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** The warded figure — "8 · 1.3 ha", or "—" before the first claim. */
const warded = (page: Page) =>
  page
    .locator('.hud__value--warded')
    .innerText()
    .then((t) => Number.parseInt(t, 10) || 0);

async function notNow(page: Page) {
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }
}

/** Put the "New ground" pile away. */
async function closeFinds(page: Page) {
  const finds = page.getByRole('dialog', { name: 'New ground' });
  await page.waitForTimeout(2_000);
  for (let i = 0; i < 10 && (await finds.isVisible().catch(() => false)); i += 1) {
    const all = finds.getByRole('button', { name: /^Close all/ });
    await ((await all.isVisible().catch(() => false)) ? all : finds.getByRole('button', { name: 'Later' })).click();
  }
}

/** A straight walk north from HERE: `n` fixes, 10 s and 10 m apart. */
function gpxNorth(n: number): string {
  const t0 = Date.UTC(2026, 9, 1, 9);
  const body = Array.from({ length: n }, (_, i) => {
    const lat = HERE.latitude + (i * 10) / 111_320;
    return `<trkpt lat="${lat}" lon="${HERE.longitude}"><time>${new Date(t0 + i * 10_000).toISOString()}</time></trkpt>`;
  }).join('');
  return `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><trkseg>${body}</trkseg></trk></gpx>`;
}

test('a built-in route plays through the game and takes the ground it crosses', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await expect.poll(() => warded(page), { timeout: 20_000 }).toBeGreaterThan(0);
  const before = await warded(page);

  // Halfway: the dot has moved on, the line follows it, the camera with it.
  const done = playRoute(page, { fixture: 'open-line' }, 20);
  await page.waitForFunction(() => ((window as unknown as { __es3Playback?: { state: () => { played: number } } }).__es3Playback?.state().played ?? 0) > 36, null, { timeout: 60_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/playback-mid.png' });
  await done;
  await expect(page.getByText('Route playback')).toBeVisible();
  // The trail is submitted in batches; the claims follow the batch.
  await expect.poll(() => warded(page), { timeout: 30_000 }).toBeGreaterThan(before + 3);

  await stopPlayback(page);
  await expect(page.getByText('Route playback')).toHaveCount(0);
});

test('a GPX track plays back as a walk, not as an import', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await expect.poll(() => warded(page), { timeout: 20_000 }).toBeGreaterThan(0);
  const before = await warded(page);

  await playRoute(page, { text: gpxNorth(40), name: 'north.gpx' });
  await expect.poll(() => warded(page), { timeout: 30_000 }).toBeGreaterThan(before + 2);
});

test('the dev panel plays a route, and saves the walk that plays back again', async ({ page }) => {
  test.setTimeout(180_000);
  await openMap(page, HERE);
  await notNow(page);

  await page.keyboard.press('p');
  const panel = page.getByRole('region', { name: 'Route playback' });
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await panel.getByLabel('Built-in').selectOption('square');
  await expect(panel).toContainText('square · 69 points · 5:40');
  await panel.getByRole('button', { name: '×60' }).click();
  await panel.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('Done · 69 of 69', { timeout: 30_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/playback.png' });

  // The ground it took raised "New ground" cards; they wait, and a modal card holds the
  // page until it is put away — as it would for a player.
  await closeFinds(page);
  // The walk just played is the run in progress: saved, it reads back as a route.
  const save = panel.getByRole('button', { name: /^Save this walk · \d+ points$/ });
  await expect(save).toBeEnabled({ timeout: 20_000 });
  const [download] = await Promise.all([page.waitForEvent('download'), save.click()]);
  const saved = JSON.parse(await readFile(await download.path(), 'utf8')) as { name: string; points: unknown[] };
  expect(saved.name).toMatch(/^Walk /);
  expect(saved.points.length).toBeGreaterThan(10);

  await panel.getByRole('button', { name: 'Stop · back to GPS' }).click();
  await playRoute(page, { text: JSON.stringify(saved) });
  await expect(panel).toContainText(saved.name);
});
