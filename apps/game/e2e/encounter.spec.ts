import { expect, test } from '@playwright/test';
// Subpath imports, not the barrel: `@es3/core` pulls in `encounters.json`, and Playwright's
// Node loader refuses a JSON import without an attribute. Only the pure halves are needed.
import { cellAt } from '@es3/core/geo';
import { rollsEncounter, utcDay } from '@es3/core/rules';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-EVENT-002 — something happens on the way, and the player can see it.
 *
 * The roll, the caps and the library are covered by unit tests. What they cannot show is
 * the failure this project keeps repeating: the content exists and the screen never offers
 * a way to it.
 *
 * An encounter is one hex in seven, which is far too flaky to walk into by luck. But the
 * roll is a pure function of the hex and the day, and this spec can import it — so instead
 * of hoping, it works out at run time which hex north of the Hearth has something to say
 * today and walks the player onto that one. Deterministic, and it needs no test-only hook
 * in the shipped build: a global that *triggers* an encounter would be a way to farm one.
 */
const START = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

// The same legs `step-claim.spec` walks: 45 m clears a res-11 cell, 45 m / 7 s is well
// under MAX_SPEED_MS, and due north stays clear of the seeded rival to the north-east.
const LEG_M = 45;
const LEG_MS = 7_000;
const dLat = (m: number) => m / 111_320;

test.use({ permissions: ['geolocation'], geolocation: START });
test.describe.configure({ mode: 'serial' });

/**
 * The nearest leg due north whose hex rolls an encounter today.
 *
 * Starts at two so the target is past the Hearth's own ring and is therefore a real claim.
 * Throws rather than skipping: within twenty legs at one in seven, finding nothing would
 * mean the constant had changed, and that is worth a red test rather than a quiet pass.
 */
function legWithEncounter(): number {
  const day = utcDay(Date.now());
  for (let leg = 2; leg <= 20; leg += 1) {
    const at = { lat: START.latitude + dLat(LEG_M * leg), lng: START.longitude };
    if (rollsEncounter(cellAt(at), day)) return leg;
  }
  throw new Error('no hex within twenty legs has an encounter today');
}

async function walkToEncounter(page: Page): Promise<void> {
  await open(page, START);
  await page.waitForTimeout(LEG_MS);

  const target = legWithEncounter();
  // Every leg in between is walked too: a step-claim only takes ground that borders yours,
  // so jumping straight to the target would claim nothing and roll nothing.
  for (let leg = 1; leg <= target; leg += 1) {
    await page.context().setGeolocation({ ...START, latitude: START.latitude + dLat(LEG_M * leg) });
    await page.waitForTimeout(LEG_MS);
  }
}

const dialog = (page: Page) => page.getByRole('region', { name: 'Something happened' });

test('walking onto the right ground turns something up', async ({ page }) => {
  test.setTimeout(200_000);
  await walkToEncounter(page);

  await expect(dialog(page)).toBeVisible({ timeout: 20_000 });
  // Every encounter ends somewhere, so there is always at least one button to leave by.
  await expect(dialog(page).getByRole('button')).not.toHaveCount(0);
});

test('answering it closes it', async ({ page }) => {
  test.setTimeout(200_000);
  await walkToEncounter(page);
  await expect(dialog(page)).toBeVisible({ timeout: 20_000 });

  // The first button that is not the close cross — whichever story today's hex holds.
  await dialog(page).locator('.adventure__choices button').first().click();
  await expect(dialog(page)).toHaveCount(0);
});

test('ESC waves one away, the same as every other sheet', async ({ page }) => {
  test.setTimeout(200_000);
  await walkToEncounter(page);
  await expect(dialog(page)).toBeVisible({ timeout: 20_000 });

  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
});
