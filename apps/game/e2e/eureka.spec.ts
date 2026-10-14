import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-EUREKA-001 — a Lore's condition met: a card says so once, and the Lore shows it.
 */
// Open ground 190 m east of the statue: the designed Härmälä (BRDC-WORLD-001) makes the
// statue's own ring houses, and Husbandry needs three plain hexes held at founding.
const HERE = { latitude: 61.473347, longitude: 23.729501, accuracy: 8 };
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

test('a eureka is announced, and the Lore shows every condition', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  // The Hearth ring is plain ground here: Husbandry's three plain hexes are held at founding.
  const card = page.getByRole('button', { name: /^Eureka · .* — dismiss$/ });
  await expect(card.first()).toBeVisible({ timeout: 20_000 });
  await expect(card.first()).toContainText('costs half');
  while (await card.first().isVisible().catch(() => false)) await card.first().click();
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }

  await page.getByRole('button', { name: 'Research', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'The Lore' });
  await expect(dialog).toContainText(/✦ Eureka · .* — half price/, { timeout: 10_000 });
  await expect(dialog).toContainText(/Eureka · Hold 12 hexes · \d+\/12/);

  // Said once: a reload brings no second card.
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(3_000);
  await expect(card).toHaveCount(0);
});
