import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-PROG-001 — The Keep · Citizens. A Season 1 save has no Keep record and sees no
 * change; a Season 2 save (one with `keep` in the pouch record) sees its citizens, the
 * granary and the Raise button.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/**
 * Give the pouch record a Keep, the way SEASON-006 will on the first day of a season.
 * The app rewrites `resources` on every settle, so a write can lose a race with one in
 * flight: read it back after a beat and write again until the Keep is really there.
 */
async function foundKeep(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await writeKeep(page);
    await page.waitForTimeout(400);
    if (await hasKeep(page)) return;
  }
  throw new Error('the Keep would not stay seeded');
}

async function hasKeep(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const open = indexedDB.open('es3');
        open.onsuccess = () => {
          const get = open.result.transaction('kv', 'readonly').objectStore('kv').get('resources');
          get.onsuccess = () => {
            open.result.close();
            resolve(Boolean(get.result?.keep));
          };
        };
      }),
  );
}

async function writeKeep(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('es3');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('kv', 'readwrite');
          const kv = tx.objectStore('kv');
          const get = kv.get('resources');
          get.onsuccess = () => {
            const cur = get.result ?? { pool: {}, since: Date.now(), sinceDay: Date.now() };
            kv.put({ ...cur, keep: { level: 1, granary: { citizens: 1, box: 0, starvedH: 0 }, titheAt: Date.now() } }, 'resources');
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

test('a Season 1 save shows no Citizens section', async ({ page }) => {
  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const keep = page.getByLabel('Your sanctuary');
  await expect(keep.getByLabel('Grow the Hearth')).toBeVisible();
  await expect(keep.getByLabel('Citizens')).toHaveCount(0);
});

test('a Season 2 save shows its citizens, granary and the Raise button', async ({ page }) => {
  await openMap(page, HERE);
  await foundKeep(page);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();

  const citizens = page.getByLabel('Your sanctuary').getByLabel('Citizens');
  await expect(citizens).toContainText('1 / 6 housed · 1 idle · Keep level 1');
  await expect(citizens).toContainText('Granary 0 / 29');
  await expect(citizens).toContainText(/Sanity \d+ · calm/);
  await expect(citizens).toContainText('Stores fill for 12 more h.');
  await expect(citizens).toContainText(/The next hex costs \d+ culture\./);
  await expect(citizens.getByRole('button', { name: /Raise the Keep · 100 food · 50 stone/ })).toBeVisible();
  // BRDC-PROG-006: the masterwork ladder, nothing met yet.
  const masterworks = page.getByLabel('Your sanctuary').getByLabel('Masterworks');
  await expect(masterworks).toContainText('The Fortress · 0 of 3 met');
  await expect(masterworks).toContainText('○ Lore · signal-fires');
});

/** Put a farm on the Hearth hex, the way building one would (BRDC-PROG-002). */
async function farmOnHearth(page: Page): Promise<void> {
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
                c.update({ ...c.value, buildings: [{ id: 'farm', builtAt: Date.now() }] });
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

test('a building on a Season 2 save takes a citizen to work (BRDC-PROG-002)', async ({ page }) => {
  await openMap(page, HERE);
  await foundKeep(page);
  await farmOnHearth(page);
  await page.reload();

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const workers = page.getByRole('region', { name: 'Selected cell' }).getByLabel('Workers');
  await expect(workers).toContainText('Farm · 0 / 1 at work — no hands, no yield', { timeout: 20_000 });
  await workers.getByRole('button', { name: 'Send a citizen' }).click();
  await expect(workers).toContainText('Farm · 1 / 1 at work');
  await expect(workers.getByRole('button', { name: 'Call one back' })).toBeVisible();
});

test('a Season 2 save studies the Lore, not the old tree (BRDC-PROG-004)', async ({ page }) => {
  await openMap(page, HERE);
  await foundKeep(page);
  await page.getByRole('button', { name: 'Research', exact: true }).click();

  const lore = page.getByRole('dialog', { name: 'The Lore' }).getByLabel('The Lore');
  await expect(lore).toContainText('Age I · Hearth');
  await expect(lore.getByLabel('Age I', { exact: true })).toContainText('Husbandry');
  await expect(lore.getByLabel('Age I', { exact: true }).getByRole('button', { name: 'Study · 30 wisdom' }).first()).toBeVisible();
  await expect(lore.getByLabel('Age II', { exact: true })).toContainText('Sealed');
});

/** Seed one rarely-written key directly (the Lore is written only when studying). */
async function seedKey(page: Page, key: string, value: unknown): Promise<void> {
  await page.evaluate(
    ([k, v]) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('es3');
        open.onsuccess = () => {
          const tx = open.result.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(v, k as string);
          tx.oncomplete = () => {
            open.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    [key, value] as const,
  );
}

test('Kindling lets a Season 2 realm dedicate a temple school (BRDC-PROG-007)', async ({ page }) => {
  await openMap(page, HERE);
  await foundKeep(page);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const schools = page.getByLabel('Your sanctuary').getByLabel('Temple schools');
  await expect(schools).toContainText('Study Kindling in the Lore to dedicate a temple.');

  await seedKey(page, 'lore', ['kindling']);
  await page.reload();
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const after = page.getByLabel('Your sanctuary').getByLabel('Temple schools');
  await after.getByRole('button', { name: 'Dedicate to The Tide' }).click();
  await expect(after).toContainText('I · Call the Shoal');
  await expect(after.getByRole('button', { name: /Learn · 40 mana/ }).first()).toBeVisible();
});
