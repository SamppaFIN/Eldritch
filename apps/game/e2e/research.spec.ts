import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-KEEP-005 — field report 2026-09-05: "still no way to research new technologies."
 *
 * Two bugs hid behind that one line. The tab was labelled "Rites", which nobody reads as
 * a tech tree — `keepTabs.test.ts` covers the rename. And a tap on a technology took a
 * visible second or more with no feedback at all (`getOwnedCells`'s full scan,
 * BRDC-SCALE-001) — indistinguishable from a dead button. This walks the whole path: open
 * it, tap one, see it respond immediately, see it land.
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

test('research is reachable from the Keep, responds immediately, and lands', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page, HERE);

  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const panel = page.getByLabel('Your sanctuary');
  await expect(panel).toBeVisible();

  // Findable: a tab that says what it is, not a ritual name for a history tech tree.
  // Keyboard, not a pointer click: a "what's new" nudge can sit over the tab bar right
  // after a version bump, and that overlap is not what this test is about.
  const tab = panel.getByRole('button', { name: 'Research' });
  await expect(tab).toBeVisible();
  await tab.focus();
  await tab.press('Enter');
  await expect(panel.getByText(/^Research ·/)).toBeVisible();

  const row = panel.locator('.hearth-panel__research-row').first();
  const button = row.getByRole('button');
  await expect(button).toBeEnabled();

  await button.focus();
  await button.press('Enter');

  // Responds immediately: the field report was indistinguishable from a dead button
  // during the second or more a full territory scan takes to answer.
  await expect(button).toBeDisabled();
  await expect(button).toHaveText(/Researching/i);

  // And lands.
  await expect(panel.getByText(/1\/10 known/i)).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => readResearched(page), { timeout: 15_000 }).toHaveLength(1);
});
