import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-INVEST-001 — a Season 2 realm chooses its investigator once, in the Keep, and the
 * choice holds through a reload. The stats read Will / Lore / Vigor / Wit.
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

test('the investigator is chosen once, in the Keep, and kept', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.getByRole('tab', { name: 'Investigator' }).click(); // the Keep's tabs (BRDC-UX-004)
  const panel = page.getByLabel('Your sanctuary').getByRole('region', { name: 'Your investigator' });
  await expect(panel).toContainText('Will 2 · Lore 3 · Vigor 2 · Wit 2', { timeout: 20_000 });

  // Picking only shows who they are; the named button commits.
  await panel.getByRole('button', { name: 'The Dockworker' }).click();
  await expect(panel).toContainText('Works cost 10 % less to raise.');
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/investigator-pick.png' });
  await panel.getByRole('button', { name: 'Begin as Mara Quill' }).click();
  await expect(panel).toContainText('Mara Quill · The Dockworker');
  await expect(panel).toContainText('Vigor 4');
  await expect(panel.getByRole('group', { name: 'Choose your investigator' })).toHaveCount(0);

  await page.reload();
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.getByRole('tab', { name: 'Investigator' }).click(); // the Keep's tabs (BRDC-UX-004)
  await expect(page.getByLabel('Your sanctuary').getByRole('region', { name: 'Your investigator' })).toContainText('Mara Quill · The Dockworker', { timeout: 20_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/investigator-chosen.png' });
});
