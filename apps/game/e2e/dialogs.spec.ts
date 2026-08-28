import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * Destructive actions and the four things a dialog owes a keyboard user.
 *
 * claude.md §14: destructive actions get a confirmation; modals trap focus, close on
 * ESC, and return focus to whatever opened them. Three out of four makes a trap, so all
 * four are asserted.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

test('withdrawing asks first', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Withdraw' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/withdraw from the walk/i);

  // Still on the map: asking is not doing.
  await expect(page.locator('.es-player__core')).toBeVisible();
});

test('keeping walking leaves everything alone', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Withdraw' }).click();
  await page.getByRole('button', { name: 'Keep walking' }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.es-player__core')).toBeVisible();
});

test('confirming withdraws', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Withdraw' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Withdraw' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('ESC closes the dialog', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Withdraw' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.es-player__core')).toBeVisible();
});

test('focus returns to the control that opened it', async ({ page }) => {
  // Without this a keyboard user is dropped at the top of the document every time
  // they cancel, which is worse than not having the dialog.
  await openMap(page);
  const withdraw = page.getByRole('button', { name: 'Withdraw' });

  await withdraw.focus();
  await withdraw.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(withdraw).toBeFocused();
});

test('focus cannot leave the dialog', async ({ page }) => {
  await openMap(page);
  await page.getByRole('button', { name: 'Withdraw' }).click();
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
  await page.getByRole('button', { name: 'Return everything to the Void' }).click();

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

  await page.getByRole('button', { name: 'Return everything to the Void' }).click();
  await page.getByRole('button', { name: 'Return it all' }).click();

  // The reset reloads; the title screen means the session went with it.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });

  const leftovers = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('es3:')),
  );
  expect(leftovers).toEqual([]);
});

test('the reset control is a real button with a real name', async ({ page }) => {
  // An icon on its own is the ch.4 anti-pattern: the glyph carries no name.
  await openMap(page);
  const reset = page.getByRole('button', { name: 'Return everything to the Void' });

  const box = await reset.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

  await reset.focus();
  await expect(reset).toBeFocused();
});
