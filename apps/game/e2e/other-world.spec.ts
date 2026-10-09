import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-OTHERWORLD-001 — on an open gate's hex, step through into the world it opens on,
 * and face what is there one encounter at a time.
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

/** A gate open on the Hearth hex, where the player stands. */
async function gateHere(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      const kv = tx.objectStore('kv');
      const home = kv.get('home');
      home.onsuccess = () => kv.put({ gates: [{ id: 'g-e2e', h3: home.result, openedAt: Date.now() }], dawn: 999, bitten: {}, outbox: [] }, 'gates');
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }));
}

test('step through a gate, and face the first encounter of the world beyond', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  await foundKeep(page);
  await gateHere(page);
  await page.reload();
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  const here = page.getByRole('button', { name: 'Here', exact: true });
  await expect.poll(async () => {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
    return here.isEnabled();
  }, { timeout: 30_000 }).toBe(true);
  await here.click();

  const through = page.getByRole('region', { name: 'Selected cell' }).getByLabel('Through the gate');
  const step = through.getByRole('button', { name: /^Step through — into / });
  await expect(step).toBeVisible({ timeout: 20_000 });
  await step.click();
  await expect(through).toContainText(/ · 1 of 2\./, { timeout: 10_000 });
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/otherworld.png' });
  await through.getByRole('button', { name: /^Face it · / }).click();
  // Either on to the second encounter, or thrown back with the gate still open.
  await expect(through).toContainText(/ · 2 of 2\.|thrown back through the gate/, { timeout: 10_000 });
});
