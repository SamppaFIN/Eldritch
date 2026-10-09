import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-TERROR-001 — the town's terror, as the shared season names it, stands on the
 * walking sheet's line beside the sky.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('a terrified town is said on the sheet', async ({ page }) => {
  test.setTimeout(150_000);
  const opensAt = Date.now() - 86_400_000;
  await page.route('**/season', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ n: 3, name: 'The Long Tide', seed: 's3', phase: 'open', opensAt, doom: 4, bossHp: 0, bossMaxHp: 0, terror: 8 }),
    }),
  );
  await openMap(page, HERE);
  const intro = page.getByRole('dialog', { name: 'Welcome to The Long Tide' });
  await expect(intro).toBeVisible({ timeout: 20_000 });
  await intro.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByLabel('Up next')).toContainText('Terror 8/10', { timeout: 20_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/terror.png' });
});
