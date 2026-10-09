import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-MYTHOS-001 — the day's Mythos headline is read once, as an edge card, from the
 * season the Worker names; a reload the same day does not bring it back.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the day’s headline is read once', async ({ page }) => {
  test.setTimeout(150_000);
  // One opening, as the Worker would say it every time (a fresh Date.now() per request is a new season).
  const opensAt = Date.now() - 86_400_000;
  await page.route('**/season', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ n: 3, name: 'The Long Tide', seed: 's3', phase: 'open', opensAt, doom: 1, bossHp: 0, bossMaxHp: 0 }),
    }),
  );
  await openMap(page, HERE);
  // A new realm in an open season is told its rules first.
  const intro = page.getByRole('dialog', { name: 'Welcome to The Long Tide' });
  await expect(intro).toBeVisible({ timeout: 20_000 });
  await intro.getByRole('button', { name: 'Begin' }).click();
  const card = page.getByRole('button', { name: /^Mythos · .* — dismiss$/ });
  // One card at a time (BRDC-UX-002): a fresh realm's eurekas can arrive ahead of the
  // headline in the queue and hide it — read them away until it is the one showing.
  const eureka = page.getByRole('button', { name: /^Eureka · .* — dismiss$/ });
  let read = false;
  await expect
    .poll(async () => {
      if (await eureka.first().isVisible().catch(() => false)) await eureka.first().click({ timeout: 2_000 }).catch(() => undefined);
      // Read it the moment it shows — a later eureka can slip in ahead of it again.
      if (await card.isVisible().catch(() => false)) read = await card.click({ timeout: 2_000 }).then(() => true, () => read);
      return read && (await card.count()) === 0;
    }, { timeout: 40_000 })
    .toBe(true);
  // The card hides at once and the store hears of it a moment later: reload only once it has.
  await expect.poll(() => page.evaluate(() => new Promise<number | undefined>((res) => {
    const o = indexedDB.open('es3');
    o.onsuccess = () => {
      const g = o.result.transaction('kv', 'readonly').objectStore('kv').get('mythos');
      g.onsuccess = () => { o.result.close(); res((g.result as { seenDay?: number } | undefined)?.seenDay); };
    };
  })), { timeout: 10_000 }).not.toBeUndefined();

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(3_000);
  await expect(card).toHaveCount(0);
});
