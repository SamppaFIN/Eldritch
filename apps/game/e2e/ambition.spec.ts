import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-AMBITION-001 — the season's ambition is chosen once in the Keep, asks twice,
 * stays locked after a reload, and its progress rides the up-next strip.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('choose an ambition once; it stays locked and shows its progress', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  const notNow = async () => {
    for (let i = 0; i < 3; i += 1) {
      const n = page.getByRole('button', { name: 'Not now' }).first();
      if (await n.isVisible().catch(() => false)) await n.click();
    }
  };
  await notNow();
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.getByRole('tab', { name: 'Season' }).click(); // the Keep's tabs (BRDC-UX-004)
  const section = page.getByLabel('Your sanctuary').getByRole('region', { name: 'The season’s ambition' });
  await section.getByRole('radio', { name: /^Lord of the Ground/ }).check();
  // Choosing asks twice: picking only arms it (BRDC-UX-007).
  await expect(section.getByRole('radio', { name: /^Keeper of Temples/ })).toBeVisible();
  await section.getByRole('button', { name: 'Lock in Lord of the Ground for the season' }).click();
  await expect(section).toContainText(/Lord of the Ground\..*\d+ \/ 200/, { timeout: 10_000 });
  await expect(section.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/ambition.png' });

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await notNow();
  await expect(page.getByLabel('Up next')).toContainText(/Lord of the Ground \d+\/200/, { timeout: 20_000 });
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.getByRole('tab', { name: 'Season' }).click(); // the Keep's tabs (BRDC-UX-004)
  const again = page.getByLabel('Your sanctuary').getByRole('region', { name: 'The season’s ambition' });
  await expect(again).toContainText('Lord of the Ground.');
  await expect(again.getByRole('button')).toHaveCount(0);
});
