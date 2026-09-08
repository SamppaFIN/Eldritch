import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-SHARE-002, -003 — the shared world is opt-in, and the write path is a single POST
 * to the Worker. Off, nothing is fetched and there is no publish button; on, "Raise your
 * banner" POSTs the player's own ground and the panel reports the outcome — no new tab.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openKeep(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect(page.getByLabel('Your sanctuary')).toBeVisible({ timeout: 10_000 });
}

test('off by default: no publish button, and no world traffic', async ({ page }) => {
  const worldRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/world/') || r.url().endsWith('/submit')) worldRequests.push(r.url());
  });

  await openMap(page, HERE);
  await openKeep(page);

  await expect(page.getByRole('button', { name: 'Raise your banner' })).toHaveCount(0);
  await page.waitForTimeout(2_000);
  expect(worldRequests).toEqual([]);
});

test('on: "Raise your banner" POSTs a sealed submission and reports it sent', async ({ page }) => {
  let posted: unknown = null;
  await page.route('**/submit', async (route) => {
    posted = JSON.parse(route.request().postData() ?? '{}');
    return route.fulfill({ status: 200, json: { ok: true, cells: 1, regions: 1 } });
  });
  // The shard reads may still fire once the toggle is on — keep them off the network.
  await page.route('**/world/**', (route) => route.fulfill({ status: 204, body: '' }));

  await openMap(page, HERE);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page
    .getByRole('switch', { name: 'Share the world — see nearby realms, and let them see yours' })
    .click();
  await page.keyboard.press('Escape');

  const opened: string[] = [];
  page.on('popup', (p) => opened.push(p.url()));

  await openKeep(page);
  const raise = page.getByRole('button', { name: 'Raise your banner' });
  await expect(raise).toBeVisible();
  await raise.click();

  await expect(page.getByText('Others see your realm within the hour.')).toBeVisible({
    timeout: 10_000,
  });
  expect(opened).toEqual([]);

  const body = posted as { sum?: unknown; cells?: unknown };
  expect(typeof body.sum).toBe('string');
  expect(Array.isArray(body.cells)).toBe(true);
});
