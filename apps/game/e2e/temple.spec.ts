import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';
import type { Locator, Page } from '@playwright/test';

/**
 * BRDC-TEMPLE-002 / -KEEP-007 — the Research dialog lists schoolless technologies only.
 *
 * The ticket splits research in two: technologies that unlock a Rite carry an element
 * and are researched from a temple of that element; the rest are in the Research dialog
 * (its own HUD footer button since KEEP-007). This proves that half through the real UI
 * — with forestry and seafaring marked researched (a `K.researched` seed, a key the game
 * writes only on a completed research), astronomy's prerequisites are met, yet it never
 * appears in the list because it has a school, while a still-open schoolless one does.
 *
 * The temple half — choosing the element, the schooled rite showing in the temple's own
 * panel — needs the player standing in a dwelt-in, owned hex across a reload, which the
 * map/GPS layer does not make reproducible in a script. It is covered instead by
 * `packages/core/src/data/templeSchool.repo.test.ts` and `rules/tech.test.ts`.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });
test.describe.configure({ mode: 'serial' });

async function press(locator: Locator): Promise<void> {
  await locator.focus();
  await locator.press('Enter');
}

/** Mark forestry + seafaring researched, directly — a key the game only writes on a
 *  completed research, so the seed survives to the next read. */
async function seedResearched(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('es3', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(['forestry', 'seafaring'], 'researched');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('put failed'));
    });
  });
}

test('the Research dialog offers schoolless technologies only', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page, HERE);
  await seedResearched(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  await press(page.getByRole('button', { name: 'Research' }));
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const row = (name: string) =>
    dialog.locator('.hearth-panel__research-row').filter({ hasText: name });

  // A schoolless technology whose prerequisite (toolmaking) is open sits on the frontier.
  await expect(row('Toolmaking')).toHaveCount(1);
  // Astronomy's prerequisite (seafaring) is met — but it has a school, so the Keep is
  // not where it is researched, and seafaring itself is already known.
  await expect(row('Astronomy')).toHaveCount(0);
  await expect(row('Seafaring')).toHaveCount(0);
});
