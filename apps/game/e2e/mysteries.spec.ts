import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-MYSTERY-001 — the town's mysteries stand in the Keep: a chapter solved is read by
 * everyone, and the next one shows both of its roads.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('a solved mystery is read in the Keep, and the next one shows its roads', async ({ page }) => {
  test.setTimeout(150_000);
  const opensAt = Date.now() - 86_400_000;
  await page.route('**/season', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ n: 3, name: 'The Long Tide', seed: 's3', phase: 'open', opensAt, doom: 2, bossHp: 0, bossMaxHp: 0, cluesGathered: 35, sealedGates: 2 }),
    }),
  );
  await openMap(page, HERE);
  await page.getByRole('dialog', { name: 'Welcome to The Long Tide' }).getByRole('button', { name: 'Begin' }).click({ timeout: 20_000 });

  const keep = page.getByRole('button', { name: 'Keep', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    const card = page.getByRole('button', { name: /— dismiss$/ }).first();
    if (await card.isVisible().catch(() => false)) await card.click();
    return keep.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await keep.click();
  await page.getByRole('tab', { name: 'Season' }).click(); // the Keep's tabs (BRDC-UX-004)

  const mysteries = page.getByLabel('Your sanctuary').getByRole('region', { name: 'The town’s mysteries' });
  await expect(mysteries).toContainText('✦ The Ferryman’s Ledger.', { timeout: 20_000 });
  await expect(mysteries).toContainText('The Second Statue — the town has 35 / 60 clues and 2 / 10 gates sealed.');
  await expect(mysteries).toContainText('The Ancient One will wake 20% weaker.');
  await mysteries.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/mysteries.png' });
});
