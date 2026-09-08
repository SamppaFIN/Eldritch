import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-SHARE-002 — the shared world is opt-in. Off, nothing is fetched and there is no
 * publish button; on, "Raise your banner" opens a prefilled GitHub issue carrying the
 * player's own ground.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openKeep(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect(page.getByLabel('Your sanctuary')).toBeVisible({ timeout: 10_000 });
}

test('off by default: no publish button, and no world fetch', async ({ page }) => {
  const worldRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/world/')) worldRequests.push(r.url());
  });

  await openMap(page, HERE);
  await openKeep(page);

  await expect(page.getByRole('button', { name: 'Raise your banner' })).toHaveCount(0);
  await page.waitForTimeout(2_000);
  expect(worldRequests).toEqual([]);
});

test('on: "Raise your banner" opens a prefilled world: issue', async ({ page, context }) => {
  await openMap(page, HERE);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page
    .getByRole('switch', { name: 'Share the world — see nearby realms, and let them see yours' })
    .click();
  await page.keyboard.press('Escape');

  await openKeep(page);
  const raise = page.getByRole('button', { name: 'Raise your banner' });
  await expect(raise).toBeVisible();

  // The button opens github.com in a new tab. Intercept that first navigation and read
  // the exact URL — GitHub would only redirect an unauthenticated request to /login.
  let issueUrl = '';
  await context.route('https://github.com/**', (route) => {
    if (!issueUrl) issueUrl = route.request().url();
    return route.abort();
  });
  await Promise.all([context.waitForEvent('page').catch(() => undefined), raise.click()]);
  await expect.poll(() => issueUrl, { timeout: 10_000 }).toContain('/issues/new');

  const url = new URL(issueUrl);
  expect(url.origin + url.pathname).toBe('https://github.com/SamppaFIN/Eldritch/issues/new');
  expect(url.searchParams.get('title')).toMatch(/^world: /);
  const body = JSON.parse(url.searchParams.get('body') ?? '{}');
  expect(typeof body.sum).toBe('string');
  expect(Array.isArray(body.cells)).toBe(true);
});
