import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-CLAN-002 — the clan league: every clan measured against every other, the same
 * table shape `/demographics` already serves for players.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openMap(page: Page) {
  await open(page, HERE);
}

async function openMenuAction(page: Page, label: string) {
  await page.getByRole('button', { name: 'Menu' }).click();
  const target = page.getByRole('button', { name: label });
  if (!(await target.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^Advanced/ }).click();
  }
  await target.click();
}

test('says so when no clan has published yet', async ({ page }) => {
  await page.route('**/clan-codex', (route) => route.fulfill({ status: 204 }));
  await openMap(page);
  await openMenuAction(page, 'Clan Codex Clans measured against each other');

  const codex = page.getByRole('region', { name: 'Clan Codex' });
  await expect(codex).toBeVisible();
  await expect(codex).toContainText(/No clan has published yet/i, { timeout: 10_000 });

  await page.keyboard.press('Escape');
  await expect(codex).toHaveCount(0);
});

test('measures clans by name, not by their raw code', async ({ page }) => {
  const table = {
    v: 1,
    generatedAt: Date.now(),
    players: 2,
    metrics: [
      {
        id: 'land',
        ranked: [
          { id: '822J9N', name: 'The Rook Guard', value: 4865 },
          { id: '2KDSEU', name: 'The Pale March', value: 1622 },
        ],
        best: 4865,
        worst: 1622,
        average: 3243.5,
      },
    ],
  };
  await page.route('**/clan-codex', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(table) }),
  );
  await openMap(page);
  await openMenuAction(page, 'Clan Codex Clans measured against each other');

  const codex = page.getByRole('region', { name: 'Clan Codex' });
  await expect(codex).toBeVisible();
  await codex.getByText('Land', { exact: true }).click();

  await expect(codex).toContainText('The Rook Guard');
  await expect(codex).toContainText('The Pale March');
  // The clan's code is an identifier, not a word — it must appear nowhere in the table.
  await expect(codex).not.toContainText('822J9N');
  await expect(codex).not.toContainText('2KDSEU');
});
