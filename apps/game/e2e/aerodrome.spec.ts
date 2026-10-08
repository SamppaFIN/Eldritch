import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-AERODROME-001 — the Skyward Runway opens once the Fuming Lake is finished, is begun
 * at the old hangar, and its next page waits for the control tower.
 */
const HANGAR = { latitude: 61.47037279, longitude: 23.72395047, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HANGAR });

test('after the Fuming Lake, the sequel begins at the hangar', async ({ page }) => {
  test.setTimeout(200_000);
  await openMap(page, HANGAR);
  await page.evaluate(() => new Promise<void>((res) => {
    const o = indexedDB.open('es3');
    o.onsuccess = () => {
      const tx = o.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ 'fuming-lake': { stage: 'servitude', done: true } }, 'adventures');
      tx.oncomplete = () => { o.result.close(); res(); };
    };
  }));
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const here = page.getByRole('button', { name: 'Here', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    return here.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await here.click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toContainText('The tale starts here.', { timeout: 15_000 });
  await card.getByRole('button', { name: 'Begin — The Skyward Runway' }).click();

  const tale = page.locator('.adventure');
  await expect(tale).toContainText('Borrowed. Will return.', { timeout: 20_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/aerodrome.png' });
  await tale.getByRole('button', { name: /walk to the control tower/i }).click();
  await expect(tale).toContainText('The tale moves on. Walk to The Control Tower to hear what happens there.', { timeout: 10_000 });
});
