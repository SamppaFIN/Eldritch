import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-IDENTITY-001 — a recovery code brings back the public name and clan, and this
 * phone's own ground stays yours under the recovered id.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('a recovery code brings back your name and clan, and your ground stays yours', async ({ page }) => {
  test.setTimeout(150_000);
  // The e2e build's Worker is dead on purpose; the one call this test makes is answered here.
  await page.route('**/recover', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ playerId: 'recovered-id', name: 'Infinite', nation: 'Härmälä', banner: 'vesica', clanId: 'c1', clanName: 'The Lake' }),
    }),
  );
  await openMap(page, HERE);
  const warded = async () => Number.parseInt((await page.locator('.hud__value--warded').innerText()).replace(/\D/g, ''), 10) || 0;
  await expect.poll(warded, { timeout: 20_000 }).toBeGreaterThan(0);
  const before = await warded();

  await page.getByRole('button', { name: 'You', exact: true }).click();
  const identity = page.getByRole('region', { name: 'Your identity' });
  await identity.getByText('I already have an identity').click();
  await identity.getByRole('textbox').fill('moss lantern tide 42');
  await identity.getByRole('button', { name: 'Recover' }).click();
  await expect(identity.getByRole('status')).toContainText('You are Härmälä again', { timeout: 15_000 });

  // The reload: same ground, still counted as yours.
  await page.waitForLoadState('load');
  await expect(page.locator('.es-player__core')).toBeVisible({ timeout: 30_000 });
  await expect.poll(warded, { timeout: 20_000 }).toBe(before);
  const profileId = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open('es3');
        open.onsuccess = () => {
          const get = open.result.transaction('kv', 'readonly').objectStore('kv').get('profile');
          get.onsuccess = () => resolve((get.result as { id: string }).id);
        };
      }),
  );
  expect(profileId).toBe('recovered-id');
});
