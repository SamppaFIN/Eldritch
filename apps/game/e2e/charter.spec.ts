import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-ONBOARD-001 — the Keeper's Charter: a new realm sees its first step in the Keep and
 * at the head of the Up next strip, does it by walking, claims the reward, and the next
 * step takes its place.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
// The same legs `step-claim.spec` walks: 45 m clears a hex, 7 s keeps the pace honest.
const LEG_M = 45;
const LEG_MS = 7_000;
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function clearCards(page: Page) {
  for (let i = 0; i < 4; i += 1) {
    const b = page.getByRole('button', { name: /^(Not now|Understood)/ }).first();
    if (await b.isVisible().catch(() => false)) await b.click();
  }
  // A claim's "New ground" card is a modal; Escape closes it like any other.
  for (let i = 0; i < 3 && (await page.locator('dialog[open]').count()) > 0; i += 1) await page.keyboard.press('Escape');
}

const charter = (page: Page) => page.getByLabel('Your sanctuary').getByRole('region', { name: 'The Keeper\'s Charter' });

test('a new realm walks its first step, claims it, and the next one comes', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE, undefined, undefined, false);
  await clearCards(page);

  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect(charter(page)).toContainText('Walk into the hex beside yours.', { timeout: 15_000 });
  await expect(charter(page)).toContainText(/Chapter I · The Ground · 1 of 3/i);
  await expect(charter(page)).toContainText('Reward: +10 wisdom');
  await page.keyboard.press('Escape');

  // Two legs north: out of the Hearth's ring and onto ground that borders it.
  await page.waitForTimeout(LEG_MS);
  for (const leg of [1, 2]) {
    await page.context().setGeolocation({ ...HERE, latitude: HERE.latitude + (LEG_M * leg) / 111_320 });
    await page.waitForTimeout(LEG_MS);
  }
  await clearCards(page);
  await expect(page.getByLabel('Up next')).toContainText('Step past the Hearth — claim', { timeout: 20_000 });
  await clearCards(page);

  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await charter(page).getByRole('button', { name: 'Claim +10 wisdom' }).click();
  await expect(charter(page)).toContainText('Hold 12 hexes.', { timeout: 10_000 });
  await expect(charter(page)).toContainText(/\d+ \/ 12/);
  // Holding twelve is the step that teaches Lands, so Lands opens now — and says so once.
  await page.keyboard.press('Escape');
  const news = page.getByRole('button', { name: /Your lands is open/ });
  await expect(news).toBeVisible({ timeout: 15_000 });
  await news.click();
  await expect(news).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lands', exact: true })).toBeVisible();
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/charter.png' });
});

test('a new realm sees only what the Charter has reached; Show everything opens the rest (BRDC-ONBOARD-005)', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page, HERE, undefined, undefined, false);
  await clearCards(page);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect(charter(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('tab')).toHaveText(['Today']);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Go to' }).getByRole('button', { name: 'Research' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Lands', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('switch', { name: 'Show everything' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Go to' }).getByRole('button', { name: 'Research' })).toBeEnabled();
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect(page.getByRole('tab')).toHaveText(['Today', 'Realm', 'Investigator', 'Season']);
});
