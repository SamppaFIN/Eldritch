import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-TRADE-001 — a Tavern of yours trades gold for culture, the rate and the day's
 * allowance said first, the buying only while standing on it.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** Put a Tavern on the Hearth hex, the way building one would — cells are rarely rewritten. */
async function tavernOnHearth(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('es3');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('kv', 'readwrite');
          const kv = tx.objectStore('kv');
          const home = kv.get('home');
          home.onsuccess = () => {
            const h3 = home.result as string;
            const cursor = kv.openCursor();
            cursor.onsuccess = () => {
              const c = cursor.result;
              if (!c) return;
              if (String(c.key).startsWith('cell:') && String(c.key).endsWith(`:${h3}`)) {
                c.update({ ...c.value, buildings: [{ id: 'tavern', builtAt: Date.now() }] });
                return;
              }
              c.continue();
            };
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}

test('the Tavern says its rate, and a purchase without the gold is refused', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await tavernOnHearth(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const trade = page.getByRole('region', { name: 'Selected cell' }).getByRole('region', { name: 'Gold for culture' });
  await expect(trade).toContainText('5 gold buys one culture — 20 more today', { timeout: 20_000 });
  // The founding stash carries no gold, so the first purchase is the honest refusal.
  await trade.getByRole('button', { name: 'Buy 1 culture · 5 gold' }).click();
  await expect(trade.getByRole('status')).toContainText('Not enough gold.', { timeout: 20_000 });
});
