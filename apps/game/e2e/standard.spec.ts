import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-STANDARD-001 — plant your standard on the hex you stand on, your own ground only.
 * The refusal off your ground is the store's (standard.repo.test) and the button's
 * (useStandard.test); here, the walker's path and the flag on the map.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const flags = (page: Page) =>
  page.evaluate(() => (globalThis as unknown as { __esMap: import('maplibre-gl').Map }).__esMap.querySourceFeatures('standard').length);

async function clear(page: Page) {
  // Lesson cards can stack; wave each away.
  for (let i = 0; i < 3; i += 1) {
    const notNow = page.getByRole('button', { name: 'Not now' }).first();
    if (!(await notNow.isVisible().catch(() => false))) return;
    await notNow.click();
  }
}

test('the standard goes up where you stand, stays after a reload, and says when it is already there', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await clear(page);
  const plant = page.getByRole('button', { name: 'Plant your standard' });
  await plant.click();
  await expect(page.getByRole('status').filter({ hasText: 'Your standard is planted here.' })).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => flags(page), { timeout: 15_000 }).toBeGreaterThan(0); // a point repeats across tile edges
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/standard.png' });

  await clear(page);
  // aria-disabled, not disabled: a thumb can still tap it to hear why. Playwright waits on
  // aria-disabled as if it were disabled, hence force.
  await plant.click({ force: true });
  await expect(page.getByRole('status').filter({ hasText: 'Your standard already stands here.' })).toBeVisible();

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => flags(page), { timeout: 20_000 }).toBeGreaterThan(0);
});
