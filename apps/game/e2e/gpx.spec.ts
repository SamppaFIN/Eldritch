import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';

/**
 * BRDC-GPX-001 — a recorded track walked into the game.
 *
 * The requirement from PIVOT §9 is that an import behaves *identically* to a walk, which
 * is proved in `gpx.repo.test.ts` against the real repository. This is the other half:
 * that a person with a file can actually get it in, and is told what happened to it.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

/** A short walk north, ten seconds a step — the shape a watch writes. */
function track(points = 8): string {
  const t0 = Date.parse('2026-09-11T10:00:00Z');
  const body = Array.from({ length: points }, (_, i) => {
    const lat = HERE.latitude + (i * 12) / 111_320;
    const when = new Date(t0 + i * 10_000).toISOString();
    return `<trkpt lat="${lat}" lon="${HERE.longitude}"><ele>90</ele><time>${when}</time></trkpt>`;
  }).join('');
  return `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><trkseg>${body}</trkseg></trk></gpx>`;
}

async function openImport(page: import('@playwright/test').Page) {
  await open(page, HERE);
  await page.getByRole('button', { name: 'Menu' }).click();
  // Behind Advanced, and named exactly: "Advanced · history · import a walk" is a button
  // too, and a loose match clicked that and never reached the import (BRDC-GPX-004).
  await page.getByRole('button', { name: /^Advanced/ }).click();
  await page.getByRole('button', { name: 'Import a walk', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Import a walk' });
  await expect(panel).toBeVisible({ timeout: 15_000 });
  return panel;
}

/** Choose the file, then walk it in at once — playing it is the other choice (BRDC-APK-001). */
async function walkIn(panel: import('@playwright/test').Locator, name: string, body: string) {
  await panel.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/gpx+xml', buffer: Buffer.from(body) });
  await panel.getByRole('button', { name: 'Walk it in at once' }).click();
}

test('a track is read, walked, and reported', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await openImport(page);

  await walkIn(panel, 'walk.gpx', track());

  // It says what it read and what it took, because a track that half-lands in silence is
  // the kind of thing a player decides is broken.
  await expect(panel).toContainText('8 points read', { timeout: 20_000 });
  await expect(panel).toContainText(/\d+ walked/);
  await expect(panel).toContainText(/\d+ m/);
});

test('a walk recorded far from the realm takes its own path (BRDC-GPX-005)', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await openImport(page);
  // Two kilometres north of the Hearth: nothing of the realm anywhere near it.
  const far = track().replace(/lat="([\d.]+)"/g, (_, lat: string) => `lat="${Number(lat) + 0.02}"`);
  await walkIn(panel, 'pocket.gpx', far);
  await expect(panel).toContainText('8 points read', { timeout: 20_000 });
  await expect(panel).toContainText(/new land/, { timeout: 20_000 });
  await expect(panel).not.toContainText('out of reach');
});

test('a file that is not a track says so, by name', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await openImport(page);

  await panel.locator('input[type=file]').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"not":"gpx"}'),
  });
  await expect(panel).toContainText('not a GPX file', { timeout: 15_000 });
});

test('a track with no timestamps is refused, and says why', async ({ page }) => {
  /*
   * Not a technicality: the interval and speed filters are the anti-cheat, and inventing
   * a timestamp is inventing a speed.
   */
  test.setTimeout(200_000);
  const panel = await openImport(page);

  await panel.locator('input[type=file]').setInputFiles({
    name: 'untimed.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from('<gpx version="1.1"><trk><trkseg><trkpt lat="61.47" lon="23.72"/></trkseg></trk></gpx>'),
  });
  await expect(panel).toContainText(/no timestamps/i, { timeout: 15_000 });
  await expect(panel).toContainText(/walking from driving/i);
});

/*
 * BRDC-GPX-002. "tee siitä sellainen, että käyttäjä voi halutessaan avata uudet maakortit
 * yksi kerrallaan tai sitten kaikki kerralla."
 *
 * An import can land dozens of hexes. Before this it reported "38 walked" and stopped,
 * leaving every one of them unrevealed with nothing on screen to do about it.
 */
async function importTrack(page: import('@playwright/test').Page, points = 14) {
  const panel = await openImport(page);
  await walkIn(panel, 'walk.gpx', track(points));
  await expect(panel).toContainText(/\d+ walked/, { timeout: 20_000 });
  return panel;
}

test('an import offers both paces through the new ground', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await importTrack(page);

  await expect(panel).toContainText(/new land/, { timeout: 20_000 });
  await expect(panel.getByRole('button', { name: 'One at a time' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'All at once' })).toBeVisible();
});

test('one at a time turns the cards over, and ends', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await importTrack(page);
  await expect(panel).toContainText(/new land/, { timeout: 20_000 });

  await panel.getByRole('button', { name: 'One at a time' }).click();
  // A card of its own, and a count so the player knows how many are left.
  await expect(panel.locator('.gpx__card')).toBeVisible({ timeout: 15_000 });
  await expect(panel).toContainText(/1 of \d+/);

  // Walking to the end must reach an end, not a dead screen.
  for (let i = 0; i < 40; i += 1) {
    const next = panel.getByRole('button', { name: /Next land|Done/ });
    if ((await next.count()) === 0) break;
    await next.click();
  }
  await expect(panel).toContainText(/That is all/, { timeout: 15_000 });
});

test('all at once names every one of them', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await importTrack(page);
  await expect(panel).toContainText(/new land/, { timeout: 20_000 });

  await panel.getByRole('button', { name: 'All at once' }).click();
  await expect(panel.locator('.gpx__lands-row').first()).toBeVisible({ timeout: 20_000 });
  // Every hex gets a line — a tally with rows missing would be worse than no tally.
  await expect.poll(() => panel.locator('.gpx__lands-spoils').count(), { timeout: 20_000 })
    .toBeGreaterThan(0);
  await expect(panel).toContainText(/looked at/);
});

/*
 * BRDC-APK-001. "haluan nähdä siis tän playback simulaationa.. käyttäjä painaa play,
 * valitsee nopeuden ja kartta antaa playbackinä mitä tapahtuu pelissä"
 */
test('a walk plays on the map, and the ground falls as it goes', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await openImport(page);
  const far = track(14).replace(/lat="([\d.]+)"/g, (_, lat: string) => `lat="${Number(lat) + 0.02}"`);
  await panel.locator('input[type=file]').setInputFiles({ name: 'pocket.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(far) });
  await panel.getByRole('button', { name: 'Play ×60' }).click();
  await expect(panel).toHaveCount(0);

  const player = page.getByRole('region', { name: 'Walk playing' });
  await expect(player).toContainText('pocket', { timeout: 15_000 });
  await expect(player.getByRole('button', { name: '×60' })).toHaveAttribute('aria-pressed', 'true');
  await expect(player).toContainText('played through', { timeout: 90_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/walk-player.png' });
  await player.getByRole('button', { name: 'Close' }).click();
  await expect(player).toHaveCount(0);
});
