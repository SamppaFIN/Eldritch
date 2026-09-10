import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';

const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('does spending scale to a real realm?', async ({ page }) => {
  test.setTimeout(300_000);
  await open(page, HERE);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 20_000 });

  // Seed a realm the size Infinite actually plays: ~340 owned cells, plus a full pouch.
  const seeded = await page.evaluate(async () => {
    const { latLngToCell, gridDisk, cellToParent } = await import(
      /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/h3-js@4.1.0/+esm'
    );
    const home = latLngToCell(61.47290805, 23.72588249, 11);
    const cells: string[] = gridDisk(home, 11);
    const me = await new Promise<string>((res) => {
      const r = indexedDB.open('es3');
      r.onsuccess = () => {
        const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('profile');
        g.onsuccess = () => res((g.result as { id: string }).id);
      };
    });
    await new Promise<void>((res) => {
      const r = indexedDB.open('es3');
      r.onsuccess = () => {
        const tx = r.result.transaction('kv', 'readwrite');
        const st = tx.objectStore('kv');
        for (const h3 of cells) {
          st.put(
            { h3, ownerId: me, strength: 300, lastVisitedAt: Date.now(), visitDays: [], ownedDays: 2 },
            `cell:${cellToParent(h3, 6)}:${h3}`,
          );
        }
        st.put(
          { pool: { wood: 500, stone: 500, iron: 500, food: 500, gold: 500, wisdom: 200, mana: 200, culture: 200, tokens: 50 }, since: Date.now(), sinceDay: Date.now() },
          'resources',
        );
        tx.oncomplete = () => res();
      };
    });
    return cells.length;
  });
  console.log('SEEDED CELLS:', seeded);

  await page.reload();
  await page.waitForTimeout(8_000);
  console.log('POUCH:', (await page.locator('.hud__value--pouch').innerText()).replace(/\n/g, ' '));

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 20_000 });

  const ward = card.getByRole('button', { name: /Ward/ }).first();
  if (await ward.count()) {
    const t0 = Date.now();
    await ward.click();
    try {
      await expect(card).toContainText(/\b(1[0-9][0-9]|[2-5][0-9][0-9])\s*\/\s*500/, { timeout: 60_000 });
      console.log(`WARD took ${Date.now() - t0}ms`);
    } catch {
      console.log(`WARD did NOT resolve in 60s (${Date.now() - t0}ms)`);
    }
  } else {
    console.log('NO WARD BUTTON');
  }
});
