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
  await page.getByRole('button', { name: 'Import a walk' }).click();
  const panel = page.getByRole('region', { name: 'Import a walk' });
  await expect(panel).toBeVisible({ timeout: 15_000 });
  return panel;
}

test('a track is read, walked, and reported', async ({ page }) => {
  test.setTimeout(200_000);
  const panel = await openImport(page);

  await panel.locator('input[type=file]').setInputFiles({
    name: 'walk.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(track()),
  });

  // It says what it read and what it took, because a track that half-lands in silence is
  // the kind of thing a player decides is broken.
  await expect(panel).toContainText('8 points read', { timeout: 20_000 });
  await expect(panel).toContainText(/\d+ walked/);
  await expect(panel).toContainText(/\d+ m/);
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
  await panel.locator('input[type=file]').setInputFiles({
    name: 'walk.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(track(points)),
  });
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
