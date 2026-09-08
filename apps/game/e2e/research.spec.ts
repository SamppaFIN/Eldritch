import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-KEEP-005 / -007 — field reports 2026-09-05: research was unreachable, then a
 * tab nobody scrolled to. It is its own HUD footer button and dialog now, the way The
 * Wager is. This walks the whole path: the footer button opens it, a tap responds at
 * once (the full territory scan takes a visible second, BRDC-SCALE-001), and it lands.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function readResearched(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('es3', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const value = await new Promise<unknown>((resolve) => {
      const req = db.transaction('kv', 'readonly').objectStore('kv').get('researched');
      req.onsuccess = () => resolve(req.result);
    });
    return (value as string[] | undefined) ?? [];
  });
}

/**
 * Put wisdom in the pouch, then boot on it. Since BRDC-ECON-007 there is no starter gift,
 * and a fresh game has none — so a spec about *spending* wisdom has to seed it. The write
 * is done from a static asset page (`/icon.svg`), where no app JS is running to race it,
 * and then `/` is loaded fresh so the first pouch read is the seeded one.
 */
async function seedWisdomAndReboot(page: Page): Promise<void> {
  await page.goto('/icon.svg');
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('es3', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const now = Date.now();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ pool: { wisdom: 900 }, since: now, sinceDay: now }, 'resources');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('put failed'));
    });
  });
  await page.goto('/');
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });
}

test('research opens from the footer, responds immediately, and lands', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page, HERE);
  await seedWisdomAndReboot(page);
  // The pouch shows the seeded wisdom before the dialog is asked to price anything —
  // the HUD reads the same React state the research row's afford check does.
  await expect(page.locator('.hud__pouch')).toContainText(/9\d\d/, { timeout: 20_000 });

  // Keyboard, not a pointer click: a "what's new" nudge can sit over the footer right
  // after a version bump, and that overlap is not what this test is about.
  const opener = page.getByRole('button', { name: 'Research' });
  await expect(opener).toBeVisible();
  await opener.focus();
  await opener.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/^Research ·/)).toBeVisible();

  const row = dialog.locator('.hearth-panel__research-row').first();
  const button = row.getByRole('button');
  await expect(button).toBeEnabled({ timeout: 15_000 });

  await button.focus();
  await button.press('Enter');

  // Responds immediately — silence for the second a full scan takes reads as broken.
  await expect(button).toBeDisabled();
  await expect(button).toHaveText(/Researching/i);

  // And lands.
  await expect(dialog.getByText(/1\/13 known/i)).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => readResearched(page), { timeout: 15_000 }).toHaveLength(1);
});
