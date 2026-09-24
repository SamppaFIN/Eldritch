import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-DETAIL-003 — every action a hex offers sits in one row at the top of its card,
 * reachable without scrolling; a section opens under the row, one at a time.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the Hearth card puts its actions in one row at the top', async ({ page }) => {
  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 10_000 });

  const row = card.getByRole('group', { name: 'Actions on this hex' });
  await expect(row.getByRole('button', { name: /^Ward/ })).toBeVisible();
  await expect(row.getByRole('button', { name: 'Works', exact: true })).toBeVisible();

  // In the upper half of the screen, straight under the header — no scrolling for it.
  const box = await row.boundingBox();
  const height = page.viewportSize()?.height ?? 640;
  expect(box).not.toBeNull();
  expect((box?.y ?? height) + (box?.height ?? 0)).toBeLessThan(height / 2 + (box?.height ?? 0));

  // A section opens under the row and closes on a second press.
  const works = row.getByRole('button', { name: 'Works', exact: true });
  await expect(card).not.toContainText('This ground holds');
  await works.click();
  await expect(works).toHaveAttribute('aria-expanded', 'true');
  await expect(card).toContainText('Monument');
  await works.click();
  await expect(works).toHaveAttribute('aria-expanded', 'false');
  await expect(card.locator('.cell-panel__build')).toHaveCount(0);
});
