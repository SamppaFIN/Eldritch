import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * Your lands and the Keeper's Counsel open from the walking sheet, beside the Vigil
 * (Infinite 2026-09-30, drawn on a screenshot), and the nav bar keeps its five tabs.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('Lands and Counsel sit on the walking sheet, and the nav keeps five tabs', async ({ page }) => {
  await openMap(page, HERE);
  const card = page.getByRole('dialog', { name: 'The ground pays' });
  if (await card.isVisible().catch(() => false)) await card.getByRole('button', { name: 'Not now' }).click();
  const labels = await page.getByRole('navigation', { name: 'Go to' }).locator('.hud-nav__label').allTextContents();
  expect(labels).toEqual(['Map', 'Here', 'Keep', 'Research', 'You']);
  expect(await page.locator('.hud').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);

  await page.getByRole('button', { name: 'Lands', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your lands' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Your lands' })).toBeHidden();

  await page.getByRole('button', { name: 'Counsel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The Keeper’s Counsel' })).toBeVisible();
});
