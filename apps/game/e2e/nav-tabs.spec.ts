import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * Your lands and the Keeper's Counsel open from the nav bar (Infinite 2026-09-30:
 * *"siirrä my lands ja council tuohon osioon"*), and seven tabs still fit a 360px phone.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('Lands and Counsel are tabs, and every tab label fits', async ({ page }) => {
  await openMap(page, HERE);
  const nav = page.getByRole('navigation', { name: 'Go to' });
  const labels = await nav.locator('.hud-nav__label').evaluateAll((els) =>
    els.map((e) => ({ text: e.textContent, fits: e.scrollWidth <= (e.parentElement?.clientWidth ?? 0) })),
  );
  expect(labels.map((l) => l.text)).toEqual(['Map', 'Here', 'Keep', 'Lands', 'Research', 'Counsel', 'You']);
  expect(labels.filter((l) => !l.fits)).toEqual([]);
  expect(await nav.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);

  await nav.getByRole('button', { name: 'Lands' }).click();
  await expect(page.getByRole('heading', { name: 'Your lands' })).toBeVisible();
  await nav.getByRole('button', { name: 'Map' }).click();
  await expect(page.getByRole('heading', { name: 'Your lands' })).toBeHidden();

  await nav.getByRole('button', { name: 'Counsel' }).click();
  await expect(page.getByRole('heading', { name: 'The Keeper’s Counsel' })).toBeVisible();
});
