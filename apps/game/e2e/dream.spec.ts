import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-DREAM-001 — last night.s dream waits as an edge card: faced once, then put away.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** A Keep in the pouch record, written until it stays (the app rewrites `resources`). */
async function foundKeep(page: Page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const kept = await page.evaluate(() => new Promise<boolean>((resolve) => {
      const open = indexedDB.open('es3');
      open.onsuccess = () => {
        const tx = open.result.transaction('kv', 'readwrite');
        const kv = tx.objectStore('kv');
        const get = kv.get('resources');
        get.onsuccess = () => {
          const cur = get.result ?? { pool: {}, since: Date.now(), sinceDay: Date.now() };
          kv.put({ ...cur, keep: { level: 1, granary: { citizens: 1, box: 0, starvedH: 0 }, titheAt: Date.now() } }, 'resources');
        };
        tx.oncomplete = () => {
          setTimeout(() => {
            const read = open.result.transaction('kv', 'readonly').objectStore('kv').get('resources');
            read.onsuccess = () => { open.result.close(); resolve(Boolean(read.result?.keep)); };
          }, 400);
        };
      };
    }));
    if (kept) return;
  }
  throw new Error('the Keep would not stay seeded');
}

/** Last night's dream, drawn this morning (the walk writer's part is unit-tested). */
async function dreamtLastNight(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const d = new Date();
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ day, cardId: 'propeller-boy' }, 'dream');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('a dream is faced once, read, and put away for good', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await dreamtLastNight(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  // One card at a time (BRDC-UX-002): a fresh Keep's eurekas come first, read them away.
  const eureka = page.getByRole('button', { name: /^Eureka · .* — dismiss$/ });
  await page.waitForTimeout(2_000);
  while (await eureka.first().isVisible().catch(() => false)) await eureka.first().click();
  const face = page.getByRole('button', { name: 'Dream · The Propeller Boy — face it' });
  await expect(face).toBeVisible({ timeout: 20_000 });
  await expect(face).toContainText('Tap to face it · Will test');
  await face.click();
  const read = page.getByRole('button', { name: 'Dream · The Propeller Boy — dismiss' });
  await expect(read).toContainText(/✦ You keep up|✕ You fall behind/);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/dream.png' });
  await read.click();
  await expect(read).toBeHidden();

  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(3_000);
  await expect(page.getByRole('button', { name: /^Dream · / })).toHaveCount(0);
});
