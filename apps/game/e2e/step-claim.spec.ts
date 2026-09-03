import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-CLAIM-009 and BRDC-CLAIM-011 — with the loop off (the default), territory grows
 * one hex at a time: step onto unclaimed ground that borders yours and it is taken, and
 * a "New ground" screen says so.
 *
 * The bug CLAIM-011 fixes: with the loop off, nothing loaded territory that was already
 * held — `useTerritory` only refreshed after a claim. A new game opened to an empty map
 * and a "—" count, and stepping put ground in the store while the screen stayed blank
 * until something else happened to refresh it. These walk a real browser against the
 * preview build and insist the map, the count and the screen keep up.
 */
const START = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

// 45 m per fix clears a res-11 cell (~46 m across) so every leg past the Hearth ring is a
// fresh claim, and 45 m / 7 s is 6.4 m/s — comfortably under MAX_SPEED_MS with room for
// timing jitter, and over MIN_POINT_INTERVAL_MS. Due north stays clear of the seeded
// rival to the north-east.
const LEG_M = 45;
const LEG_MS = 7_000;
const dLat = (m: number) => m / 111_320;

test.use({ permissions: ['geolocation'], geolocation: START });

// One walk at a time. These tests move a real GPS clock and watch a screen that dismisses
// itself in 4.5 s; two of them racing for one CPU makes the timing meaningless.
test.describe.configure({ mode: 'serial' });

async function openMap(page: Page) {
  await open(page, START);
  // Let the Hearth's closing fix age past MIN_POINT_INTERVAL_MS before the first leg.
  await page.waitForTimeout(LEG_MS);
}

/** Put the player `leg` legs north of the Hearth. */
async function walkTo(page: Page, leg: number) {
  await page.context().setGeolocation({ ...START, latitude: START.latitude + dLat(LEG_M * leg) });
}

const newGround = (page: Page) => page.getByRole('heading', { name: 'New ground' });

/** `.hud__value` index 2 is "Warded cells" — "8 · 12974 m²", or "—" before the first. */
function wardedCount(page: Page) {
  return page
    .locator('.hud__value')
    .nth(2)
    .innerText()
    .then((t) => Number.parseInt(t, 10) || 0);
}

function cellsOnMap(page: Page) {
  return page.evaluate(() => {
    const map = (
      globalThis as unknown as {
        __esMap?: {
          getSource: (id: string) => { serialize?: () => { data?: { features?: unknown[] } } } | undefined;
        };
      }
    ).__esMap;
    return map?.getSource('cells')?.serialize?.().data?.features?.length ?? 0;
  });
}

/** Walk north a leg at a time until the "New ground" screen is up. Returns the leg. */
async function stepUntilNewGround(page: Page, to = 10): Promise<number> {
  for (let leg = 1; leg <= to; leg += 1) {
    await walkTo(page, leg);
    try {
      await newGround(page).waitFor({ state: 'visible', timeout: LEG_MS - 1_000 });
      return leg;
    } catch {
      await page.waitForTimeout(1_000);
    }
  }
  throw new Error(`no "New ground" screen after ${to} legs`);
}

test('a fresh game shows the ground already held before a single step', async ({ page }) => {
  // Only a step-claim used to call refresh(), so the Hearth ring — owned in storage from
  // the moment the Hearth is accepted — was absent from the map and the count until then.
  test.setTimeout(120_000);
  await openMap(page);

  await expect.poll(() => wardedCount(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(7);
  expect(await cellsOnMap(page)).toBeGreaterThanOrEqual(7);
});

test('walking past the Hearth ring raises "New ground", which closes itself', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page);

  await stepUntilNewGround(page);

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Reveal what it holds' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open its card' })).toBeVisible();

  // It must not sit in the way of the next step. The window is 4.5 s; the generous timeout
  // is for Chromium throttling a background context's timers, not for the app.
  await expect(newGround(page)).toBeHidden({ timeout: 25_000 });
});

test('consecutive steps each commit — the count follows every one', async ({ page }) => {
  test.setTimeout(200_000);
  await openMap(page);

  const start = await wardedCount(page); // the Hearth ring, seven
  let committedLegs = 0;
  for (let leg = 1; leg <= 9; leg += 1) {
    const before = await wardedCount(page);
    await walkTo(page, leg);
    await page.waitForTimeout(LEG_MS);
    if ((await wardedCount(page)) > before) committedLegs += 1;
  }

  // Nothing but a committed step-claim moves the warded count, and it climbed leg after
  // leg past the Hearth's own seven — not once, then silence.
  expect(await wardedCount(page)).toBeGreaterThanOrEqual(start + 4);
  expect(committedLegs).toBeGreaterThanOrEqual(4);
});

test('the new hex opens its own card, and reveal pays out once', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page);

  await stepUntilNewGround(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Open its card' }).click();

  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 8_000 });

  // Reveal is free and once: the button becomes the tier, said in a sentence. The action
  // round-trips through storage, so give it room.
  await card.getByRole('button', { name: 'Reveal this ground' }).click();
  await expect(
    card.getByText(/nothing hidden here|an uncommon find|a rare site|a place of power/i),
  ).toBeVisible({ timeout: 12_000 });
  await expect(card.getByRole('button', { name: 'Reveal this ground' })).toBeHidden();
});

test('a tap on the map opens a cell card even with almost no ground drawn', async ({ page }) => {
  // CLAIM-009 regression: a tap used to fall through to nothing when the fog left the map
  // bare — queryRenderedFeatures found no hex under the point. The fix derives the cell
  // from the tap's coordinates instead. Tested with only the Hearth ring owned.
  test.setTimeout(120_000);
  await openMap(page);

  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  await canvas.click({
    position: { x: (box?.width ?? 320) / 2, y: (box?.height ?? 600) / 2 - 40 },
  });

  await expect(page.getByRole('region', { name: 'Selected cell' })).toBeVisible({ timeout: 8_000 });
});
