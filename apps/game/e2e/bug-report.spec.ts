import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-BUGREPORT-002 — a report can go straight to GitHub as a prefilled issue the player
 * submits under their own account. No token: the link is all there is.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('a report opens as a prefilled GitHub issue, without a position', async ({ page }) => {
  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Menu' }).click();
  // It lives behind the menu's Advanced row, with History and import.
  await page.getByRole('button', { name: /^Advanced/ }).click();
  await page.getByRole('button', { name: 'Report a bug or improvement' }).click();
  const panel = page.getByRole('region', { name: 'Report a bug or improvement' });

  // An <a> without href is not a link to a screen reader yet, so find it by its words.
  const link = panel.locator('a', { hasText: 'Open as GitHub issue' });
  // Nothing written, nowhere to go.
  await expect(link).toHaveAttribute('aria-disabled', 'true');

  await panel.getByLabel('What happened?').fill('The standard stayed on the old hex');
  await panel.getByRole('button', { name: 'Improvement' }).click();
  await expect(link).toHaveAttribute('aria-disabled', 'false');
  const url = new URL((await link.getAttribute('href')) ?? '');
  expect(url.origin + url.pathname).toBe('https://github.com/SamppaFIN/Eldritch/issues/new');
  expect(url.searchParams.get('labels')).toBe('enhancement');
  expect(url.searchParams.get('title')).toBe('Idea: The standard stayed on the old hex');
  expect(url.searchParams.get('body')).toMatch(/- Version: v\d+\.\d+\.\d+/);
  expect(url.searchParams.get('body')).not.toContain('61.47');
  // The note survives the menu re-rendering under it (it used to be wiped on every render).
  await page.waitForTimeout(3000);
  await expect(panel.getByLabel('What happened?')).toHaveValue('The standard stayed on the old hex');
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/bugreport.png' });
});
