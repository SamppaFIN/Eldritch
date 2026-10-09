import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-GREAT-001 — a great person is born: a card says so once, and their deed is used
 * once, in the Keep.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** A Scholar born a moment ago, not yet announced. */
async function scholarBorn(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      const now = Date.now();
      tx.objectStore('kv').put({
        since: now,
        points: { scholar: 0, merchant: 0, mystic: 0 },
        people: [{ id: 'scholar-0', kind: 'scholar', name: 'Agnes of the Drowned Stacks', bornAt: now }],
      }, 'great');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('a great person is announced once, and their deed is done once', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  // Reload only once the Keep is saved, or the reloaded app has no Keep to open.
  await expect.poll(() => page.evaluate(() => new Promise<boolean>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const get = open.result.transaction('kv', 'readonly').objectStore('kv').get('castle');
      get.onsuccess = () => { open.result.close(); resolve(get.result !== undefined); };
    };
  })), { timeout: 20_000 }).toBe(true);
  await scholarBorn(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const card = page.getByRole('button', { name: 'Born · Agnes of the Drowned Stacks — dismiss' });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText('Great Scholar. Their deed — Chart the Unknown — waits in the Keep.');
  await card.click();
  await expect(card).toBeHidden();
  // A lesson can open late and hold the nav shut: put each one away until the Keep opens.
  const keep = page.getByRole('button', { name: 'Keep', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    return keep.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await keep.click();
  await page.getByRole('tab', { name: 'Season' }).click(); // the Keep's tabs (BRDC-UX-004)
  const great = page.getByLabel('Your sanctuary').getByRole('region', { name: 'Great people' });
  await great.getByRole('button', { name: 'Chart the Unknown' }).click();
  await great.getByRole('button', { name: 'Chart the Unknown — now' }).click();
  // The deed done stays said in the Keep, not only in a passing status line.
  await expect(great).toContainText('✦ Agnes of the Drowned Stacks — Chart the Unknown, done.', { timeout: 10_000 });
  await expect(great.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/great.png' });
});
