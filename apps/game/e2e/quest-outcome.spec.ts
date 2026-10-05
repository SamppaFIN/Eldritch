import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-QUEST-008 — a finished tale keeps how it ended and what it paid, past a reload, and
 * the statue still opens it.
 */
const STATUE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: STATUE });

test('a closed tale shows its ending and its rewards after a reload', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, STATUE);
  const book = {
    'fuming-lake': {
      stage: 'servitude', done: true,
      outcome: { status: 'completed', rewards: { xp: 560, pool: { wisdom: -20 } }, text: 'You accept your post.', completedAt: Date.now() },
    },
  };
  await page.evaluate((v) => new Promise<void>((res) => {
    const o = indexedDB.open('es3');
    o.onsuccess = () => { const tx = o.result.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, 'adventures'); tx.oncomplete = () => { o.result.close(); res(); }; };
  }), book);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  const unlock = page.getByRole('dialog', { name: 'The ground pays' });
  if (await unlock.isVisible().catch(() => false)) await unlock.getByRole('button', { name: 'Not now' }).click();

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toContainText('The tale ended.', { timeout: 15_000 });
  await card.getByRole('button', { name: /How the tale ended/ }).click();
  const tale = page.locator('.adventure');
  await expect(tale).toContainText('You accept your post.', { timeout: 10_000 });
  await expect(tale).toContainText('+560 XP · −20 wisdom');
});
