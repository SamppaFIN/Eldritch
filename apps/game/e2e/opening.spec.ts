import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * The opening loop, end to end: you are given a stash, you can see it, and you can spend
 * it on the one thing it is sized for.
 *
 * This exists because all three failed at once (BRDC-ECON-009) and the report was "no
 * button does anything". The founding stash is exactly one Monument — 60 stone and 10
 * culture — so the very first thing a new player is meant to do was the thing that could
 * not be done.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

test('the founding stash reaches the HUD promptly', async ({ page }) => {
  /*
   * A timing bound, and it is the honest proxy for the bug rather than the bug itself.
   * `useAdventure` was handed a fresh millisecond every render, so its fetch re-ran every
   * render, and each run settled the whole pouch and swept every owned cell. Six full
   * IndexedDB round-trips a second, forever — so every other read queued behind it and
   * the pouch took between seven and fifteen seconds to appear, getting worse the longer
   * the page stayed open. It is about four seconds now, and stable.
   */
  await openMap(page);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 8_000 });
});

test('and it can be spent on the building it is sized for', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 20_000 });

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 10_000 });

  // The build menu judges affordability from the same pouch copy the HUD shows, so while
  // that copy was empty every building read "Cannot afford" and the section said nothing
  // could be built here at all.
  await expect(card).toContainText('Monument');
  const build = card.getByRole('button', { name: 'Build', exact: true }).first();
  await expect(build).toBeEnabled();
  await build.click();

  // Both halves get the same room: the build is one store round-trip and four browsers
  // sharing a machine make that slower than the default five seconds allows.
  await expect(card).toContainText('Standing here', { timeout: 20_000 });
  await expect(card).toContainText(/Demolish/i, { timeout: 20_000 });
});

test('a greyed action says what it is waiting for (BRDC-UI-002)', async ({ page }) => {
  /*
   * The report was "I press Build or Consecrate or Ward and nothing happens". All three
   * were greyed out with no reason beside them, which on a touchscreen — where there is
   * no hover to explain it — is indistinguishable from a broken button.
   *
   * The founding stash is 60 stone and 10 culture, so Consecrate (120 stone, 80 gold) is
   * exactly the out-of-reach case a new player meets first.
   */
  await openMap(page);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 20_000 });

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 10_000 });

  const consecrate = card.getByRole('button', { name: /Consecrate/ }).first();
  await expect(consecrate).toBeDisabled();
  // It names the shortfall in the game's own words, and how else to pay it.
  await expect(card).toContainText(/Short .*(stone|gold)/);
  await expect(card).toContainText(/Walking here longer/);
});

test('Ward explains itself on ground that is already as safe as it gets', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 20_000 });

  // A hex walked for weeks sits at MAX_STRENGTH, and Ward was simply grey there — which
  // reads as broken rather than as "this ground could not be any safer".
  await page.evaluate(async () => {
    const me = await new Promise<string>((res) => {
      const r = indexedDB.open('es3');
      r.onsuccess = () => {
        const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('profile');
        g.onsuccess = () => res((g.result as { id: string }).id);
      };
    });
    const home = await new Promise<string>((res) => {
      const r = indexedDB.open('es3');
      r.onsuccess = () => {
        const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('home');
        g.onsuccess = () => res(g.result as string);
      };
    });
    await new Promise<void>((res) => {
      const r = indexedDB.open('es3');
      r.onsuccess = () => {
        const st = r.result.transaction('kv', 'readonly').objectStore('kv');
        const keys = st.getAllKeys();
        keys.onsuccess = () => {
          const key = (keys.result as string[]).find((k) => k.endsWith(home));
          const r2 = indexedDB.open('es3');
          r2.onsuccess = () => {
            const tx = r2.result.transaction('kv', 'readwrite');
            tx.objectStore('kv').put(
              { h3: home, ownerId: me, strength: 500, lastVisitedAt: Date.now(), visitDays: [] },
              key as string,
            );
            tx.oncomplete = () => res();
          };
        };
      };
    });
  });
  await page.reload();

  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText(/Already at full strength/, { timeout: 15_000 });
});
