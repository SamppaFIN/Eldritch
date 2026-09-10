import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * Destructive actions and the four things a dialog owes a keyboard user.
 *
 * claude.md §14: destructive actions get a confirmation; modals trap focus, close on
 * ESC, and return focus to whatever opened them. Three out of four makes a trap, so all
 * four are asserted.
 *
 * Retreat and Delete moved behind the "Menu" (☰) button so the walking bar keeps only
 * what a walking thumb needs — the two triggers no longer sit directly on the HUD.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

/** Open the ☰ menu and click one of its rows. */
async function openMenuAction(page: Page, label: string) {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: label }).click();
}

test('withdrawing asks first', async ({ page }) => {
  await openMap(page);
  await openMenuAction(page, 'Retreat from the map');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/withdraw from the walk/i);

  // Still on the map: asking is not doing.
  await expect(page.locator('.es-player__core')).toBeVisible();
});

test('keeping walking leaves everything alone', async ({ page }) => {
  await openMap(page);
  await openMenuAction(page, 'Retreat from the map');
  await page.getByRole('dialog').getByRole('button', { name: 'Keep walking' }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.es-player__core')).toBeVisible();
});

test('confirming withdraws', async ({ page }) => {
  await openMap(page);
  await openMenuAction(page, 'Retreat from the map');
  await page.getByRole('dialog').getByRole('button', { name: 'Withdraw' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('ESC closes the dialog', async ({ page }) => {
  await openMap(page);
  await openMenuAction(page, 'Retreat from the map');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.es-player__core')).toBeVisible();
});

test('focus returns to the menu, not dropped at the top of the document', async ({ page }) => {
  // The trigger itself ("Retreat from the map") is gone the moment the menu panel
  // closes, so there is nothing for focus to go back to but the ☰ button that opened
  // the menu in the first place — landing anywhere else is a keyboard user set adrift.
  await openMap(page);
  const menu = page.getByRole('button', { name: 'Menu' });

  await openMenuAction(page, 'Retreat from the map');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});

test('focus cannot leave the dialog', async ({ page }) => {
  await openMap(page);
  await openMenuAction(page, 'Retreat from the map');
  await expect(page.getByRole('dialog')).toBeVisible();

  // Tab well past the dialog's own controls; focus must still be inside it.
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');

  const insideDialog = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]');
    return dialog !== null && dialog.contains(document.activeElement);
  });
  expect(insideDialog).toBe(true);
});

test('resetting asks, and says exactly what it will do', async ({ page }) => {
  // v2 had no way out of a corrupt save; the only advice was to open the console.
  await openMap(page);
  await openMenuAction(page, 'Delete progress');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/cannot be undone/i);

  await page.getByRole('button', { name: 'Keep my sanctuary' }).click();
  await expect(dialog).not.toBeVisible();
});

test('resetting actually empties the sanctuary', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page);

  // Give it something to lose.
  await page.waitForTimeout(2_000);
  const before = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('es3', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Promise<number>((resolve) => {
      const request = db.transaction('kv', 'readonly').objectStore('kv').getAllKeys();
      request.onsuccess = () => resolve(request.result.length);
    });
  });
  expect(before).toBeGreaterThan(0);

  await openMenuAction(page, 'Delete progress');
  await page.getByRole('button', { name: 'Return it all' }).click();

  // The reset reloads; the title screen means the session went with it.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });

  const leftovers = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('es3:')),
  );
  expect(leftovers).toEqual([]);
});

test('the menu control is a real button with a real name, and reaches Delete progress', async ({
  page,
}) => {
  // An icon on its own is the ch.4 anti-pattern: the glyph carries no name.
  await openMap(page);
  const menu = page.getByRole('button', { name: 'Menu' });

  const box = await menu.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

  await menu.focus();
  await expect(menu).toBeFocused();

  await menu.click();
  const del = page.getByRole('button', { name: 'Delete progress' });
  await expect(del).toBeVisible();
  const delBox = await del.boundingBox();
  expect(delBox?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test('the Codex opens from the menu, and says so when the world is empty', async ({ page }) => {
  /*
   * BRDC-CODEX-001. Nothing has been published in a test run, and that is the state worth
   * locking: a player with no friends online must get a sentence telling them how the
   * Codex fills, not a spinner, an error, or a table of zeroes.
   */
  await openMap(page);
  await openMenuAction(page, 'Codex of Dominion');

  const codex = page.getByRole('region', { name: 'Codex of Dominion' });
  await expect(codex).toBeVisible();
  await expect(codex).toContainText(/No realm has published yet/i, { timeout: 10_000 });

  // Same contract as every other sheet: ESC closes it (claude.md §14).
  await page.keyboard.press('Escape');
  await expect(codex).toHaveCount(0);
});

/** A Codex the Worker might serve: three realms, and the local player is not the best. */
function cannedCodex(meNameless = 'me') {
  const realm = (id: string, value: number, nation?: string) => ({
    id,
    name: id,
    ...(nation ? { nation } : {}),
    value,
  });
  const metric = (id: string, mine: number, best: number, worst: number) => ({
    id,
    ranked: [realm('rival', best, 'The Pale Warden'), realm(meNameless, mine), realm('third', worst)],
    best,
    worst,
    average: (best + mine + worst) / 3,
  });
  return {
    v: 1,
    generatedAt: Date.now(),
    players: 3,
    metrics: [
      metric('land', 11_353, 2_500_000, 2_150),
      metric('leyline', 840, 12_400, 100),
      metric('consciousness', 2, 9, 1),
      metric('population', 280, 4_000, 40),
      metric('works', 1, 30, 0),
      metric('provinces', 1, 6, 1),
      metric('footfall', 15, 300, 1),
    ],
  };
}

/** The local player's id, straight out of the store the app writes it to. */
async function playerId(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open('es3');
        open.onsuccess = () => {
          const get = open.result.transaction('kv', 'readonly').objectStore('kv').get('profile');
          get.onsuccess = () => resolve((get.result as { id?: string } | undefined)?.id ?? '');
          get.onerror = () => resolve('');
        };
        open.onerror = () => resolve('');
      }),
  );
}

test('the Codex shows where you stand, not just who won', async ({ page }) => {
  /*
   * BRDC-CODEX-001. The Worker is not reachable from a test run, so the table is served
   * here — with the real local id in it, because the thing this screen exists for is
   * *your* figure, in its own unit, against the best/average/worst.
   */
  await openMap(page);
  const me = await playerId(page);
  expect(me).not.toBe('');

  await page.route('**/demographics', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(cannedCodex(me)) }),
  );
  await openMenuAction(page, 'Codex of Dominion');

  const codex = page.getByRole('region', { name: 'Codex of Dominion' });
  await expect(codex).toContainText('3 realms measured');

  // Your own land in m² rather than "0.01 km²", and the best of the three in km².
  await expect(codex).toContainText('11,353 m²');
  await expect(codex).toContainText('2.5 km²');
  // Ley-line in metres, footfall in days — each measure in the unit a walker reads.
  await expect(codex).toContainText('840 m');
  await expect(codex).toContainText('15 days');
  // And a placing, said as a placing: second of three, on every row.
  await expect(codex).toContainText('2nd of 3');

  // Tapping a row explains the measure and names who leads it.
  await codex.getByRole('button', { name: /Ley-line/ }).click();
  await expect(codex).toContainText('The Pale Warden');
  await expect(codex).toContainText(/A hundred laps of one block/i);
});
