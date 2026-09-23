import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * Retiring a kingdom, and the Hall of Fame it joins (BRDC-HALL-001, -003).
 *
 * Extracted from `dialogs.spec.ts` once that file passed its 400-line ceiling — retiring,
 * the local archive and the shared Chronicles are one coherent concern and nothing else
 * in that file needed the same fixtures.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

/** Open the ☰ menu and press something in it — Advanced first, if it is hidden there. */
async function openMenuAction(page: Page, label: string) {
  await page.getByRole('button', { name: 'Menu' }).click();
  const target = page.getByRole('button', { name: label });
  if (!(await target.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^Advanced/ }).click();
  }
  await target.click();
}

test('retiring asks, and says the kingdom joins the Hall of Fame first', async ({ page }) => {
  // BRDC-HALL-001 — a different door than Delete progress: this one keeps something.
  await openMap(page);
  await openMenuAction(page, 'Retire this kingdom');

  // Named, not the bare role — a non-modal tutorial toast (`UnlockMoment`) can be on
  // screen at the same time, and `getByRole('dialog')` alone would match either.
  const dialog = page.getByRole('dialog', { name: /Retire this kingdom/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Hall of Fame/i);

  // BRDC-HALL-003: the era field is there, optional, and mentions the shared Chronicles.
  await expect(dialog).toContainText(/shared/i);
  const era = dialog.getByLabel(/Name the age it stood in/i);
  await expect(era).toBeVisible();
  await era.fill('the Stone Age');

  await page.getByRole('button', { name: 'Keep building' }).click();
  await expect(dialog).not.toBeVisible();
});

test('the Chronicles tab shows kingdoms shared from every device', async ({ page }) => {
  // BRDC-HALL-003 — a flat, no-reveal-button view: someone else's kingdom, read-only.
  const entries = [
    {
      id: 'k1',
      playerId: 'p2',
      name: 'Farwalker',
      retiredAt: Date.now(),
      level: 6,
      xp: 3_000,
      cells: 40,
      areaM2: 80_000,
      population: 90,
      provinces: 3,
      achievements: 2,
      secretSites: 1,
      wonders: 0,
      cipherShards: 0,
      era: 'the Stone Age',
    },
  ];
  await page.route('**/legacy', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ entries }) }),
  );
  await openMap(page);
  await openMenuAction(page, 'Hall of Fame Kingdoms retired');

  const hall = page.getByRole('region', { name: 'Hall of Fame' });
  await expect(hall).toBeVisible();
  await hall.getByRole('button', { name: 'Chronicles' }).click();

  await expect(hall).toContainText('Farwalker');
  await expect(hall).toContainText('the Stone Age');
  await expect(hall.getByRole('button', { name: /Reveal the chronicle/i })).toHaveCount(0);
});

test('retiring archives the kingdom, then starts a fresh one', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page);
  await page.waitForTimeout(2_000);

  await openMenuAction(page, 'Retire this kingdom');
  await page.getByRole('button', { name: 'Retire it' }).click();

  // Same reload contract as Delete progress: the title screen means the session went
  // with it, and nothing under `es3:` survives in localStorage.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
  const leftovers = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('es3:')),
  );
  expect(leftovers).toEqual([]);

  // But the kingdom that just ended is waiting in the next one's Hall of Fame.
  await openMap(page);
  await openMenuAction(page, 'Hall of Fame Kingdoms retired');
  const hall = page.getByRole('region', { name: 'Hall of Fame' });
  await expect(hall).toBeVisible();
  await expect(hall).not.toContainText(/No kingdom has retired yet/i);
});

test('a kingdom retired while the Chronicles were unreachable can still be shared later', async ({
  page,
}) => {
  // BRDC-HALL-003 — this is Infinite's own two local kingdoms: retired before the
  // feature existed, so the auto-publish on retire never ran for them either. The
  // "Share to the Chronicles" button is the manual door in.
  test.setTimeout(120_000);
  await page.route('**/legacy', (route) =>
    route.request().method() === 'POST' ? route.fulfill({ status: 500 }) : route.continue(),
  );
  await openMap(page);
  await page.waitForTimeout(2_000);
  await openMenuAction(page, 'Retire this kingdom');
  await page.getByRole('button', { name: 'Retire it' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });

  await openMap(page);
  await openMenuAction(page, 'Hall of Fame Kingdoms retired');
  const hall = page.getByRole('region', { name: 'Hall of Fame' });
  const shareButton = hall.getByRole('button', { name: 'Share to the Chronicles' });
  await expect(shareButton).toBeVisible();

  // Now the Worker is reachable — sharing succeeds and the button becomes a statement.
  await page.unroute('**/legacy');
  await page.route('**/legacy', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 200, body: '{"ok":true}' })
      : route.continue(),
  );
  await shareButton.click();
  await expect(hall.getByText('Shared to the Chronicles')).toBeVisible();
  await expect(shareButton).toHaveCount(0);
});
