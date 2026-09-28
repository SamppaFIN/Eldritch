import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-WORKS-001 — a building opens its own page from the hex card, and the first node
 * of its tree can be learned with what the founding stash holds (60 stone).
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

test('the Keep opens its page and learns its first research', async ({ page }) => {
  test.setTimeout(120_000);
  await openMap(page, HERE);

  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const card = page.getByRole('region', { name: 'Selected cell' });
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.getByRole('button', { name: 'Open The Keep' }).click();

  const sheet = page.getByRole('dialog', { name: 'The Keep' });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Level 0 / 5');
  await expect(sheet).toContainText('The Old Foundation');
  // Colour never carries a state alone.
  await expect(sheet).toContainText('◆ Available');
  await expect(sheet).toContainText('○ Not yet awake');

  await sheet.getByRole('button', { name: /^Research · Warded Walls/ }).click();
  await expect(sheet).toContainText('✓ Learned', { timeout: 10_000 });
  await expect(sheet).toContainText('Level 1 / 5');

  // The page reads without its lore.
  await sheet.getByRole('button', { name: 'Lore' }).click();
  await expect(sheet).not.toContainText('lake water drawn at midnight');
  await expect(sheet).toContainText('+50 strength');

  // ESC closes the page and leaves the card.
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(card).toBeVisible();
});
