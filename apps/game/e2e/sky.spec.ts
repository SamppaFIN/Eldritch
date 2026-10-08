import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-MOON-001 / WEATHER-001 — the day's sky is named on the sheet and explains itself.
 * 2027-04-20 is a full moon and a day of fog, by the same arithmetic on every phone.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('a full moon in fog is said on the sheet, and a tap opens its Codex page', async ({ page }) => {
  test.setTimeout(150_000);
  await page.clock.setFixedTime(new Date('2027-04-20T09:00:00Z'));
  await openMap(page, HERE);
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }
  const sky = page.getByLabel('Up next').getByRole('button', { name: 'Full moon · Fog' });
  await expect(sky).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/sky.png' });
  await sky.click();
  await expect(page.getByText('Moon and Weather').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Fog: the map shows only your own ground/)).toBeVisible();
});
