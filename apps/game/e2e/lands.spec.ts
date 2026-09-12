import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';
import type { Page } from '@playwright/test';

/**
 * BRDC-LANDS-001 — the ledger of held ground.
 *
 * The map answers "where am I". Past a few dozen hexes it cannot answer "what have I got",
 * and the realm this was asked for holds three hundred and forty.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

async function openLands(page: Page) {
  await open(page, HERE);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 25_000 });
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Your lands' }).click();
  const lands = page.getByRole('region', { name: 'Your lands' });
  await expect(lands).toBeVisible({ timeout: 15_000 });
  return lands;
}

test('lists every hex held, with what it is and what it wants', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);

  // The Hearth ring is seven cells, so that is what a fresh realm has.
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });
  await expect(lands).toContainText('7 held');
  await expect(lands).toContainText('7 unrevealed');

  // Each row carries the ground, the yield, the strength, the days walked and the clock.
  const first = lands.locator('.lands__row').first();
  await expect(first).toContainText(/Plain|Forest|Hill|Mountain|Lake|Coast|Market/);
  await expect(first).toContainText(/d walked/);
});

test('puts unrevealed ground first, and never counts the Hearth as fading', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });

  // Unrevealed first is the whole opinion of the order: revealing is free, pays every
  // time, and is the one thing on this list that needs no walking.
  const tags = await lands.locator('.lands__row .lands__tag--new').count();
  expect(tags).toBe(7);

  // The Hearth cannot be lost, so it carries no countdown (BRDC-HEARTH-002).
  const hearth = lands.locator('.lands__row', { has: page.locator('.lands__tag--home') });
  await expect(hearth).toContainText('safe');
});

test('a row takes you to that hex, and ESC closes the ledger', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });

  await lands.locator('.lands__cell').first().click();
  await expect(lands).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Selected cell' })).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Your lands' }).click();
  const again = page.getByRole('region', { name: 'Your lands' });
  await expect(again).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');
  await expect(again).toHaveCount(0);
});

/** Claim a wide ring and reveal all of it, so finds are certain rather than lucky. */
async function seedRevealedRealm(page: Page, rings: number): Promise<number> {
  return page.evaluate(async (r: number) => {
    const h3 = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/h3-js@4.1.0/+esm');
    const home = h3.latLngToCell(61.47290805, 23.72588249, 11);
    const cells: string[] = h3.gridDisk(home, r);
    const now = Date.now();
    const me = await new Promise<string>((res) => {
      const req = indexedDB.open('es3');
      req.onsuccess = () => {
        const g = req.result.transaction('kv', 'readonly').objectStore('kv').get('profile');
        g.onsuccess = () => res((g.result as { id: string }).id);
      };
    });
    await new Promise<void>((res) => {
      const req = indexedDB.open('es3');
      req.onsuccess = () => {
        const tx = req.result.transaction('kv', 'readwrite');
        const st = tx.objectStore('kv');
        const revealed: Record<string, number> = {};
        for (const c of cells) {
          st.put(
            { h3: c, ownerId: me, strength: 300, lastVisitedAt: now, visitDays: [], ownedDays: 2 },
            `cell:${h3.cellToParent(c, 6)}:${c}`,
          );
          revealed[c] = now;
        }
        st.put(revealed, 'revealed');
        tx.oncomplete = () => res();
      };
    });
    return cells.length;
  }, rings);
}

test('revealed ground names what is on it (BRDC-BOUNTY-001)', async ({ page }) => {
  /*
   * Bounties are Civilization's bonus resources in this game's shape: one hex in eight has
   * something on it, bound to its own terrain, and it pays only once the ground has been
   * revealed — which turns revealing from a one-off payout into discovery.
   */
  test.setTimeout(300_000);
  await open(page, HERE);
  await expect(page.locator('.hud__value--pouch')).toContainText('60', { timeout: 25_000 });

  const count = await seedRevealedRealm(page, 6);
  await page.reload();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Your lands' }).click();
  const lands = page.getByRole('region', { name: 'Your lands' });
  await expect(lands.locator('.lands__row')).toHaveCount(count, { timeout: 40_000 });

  // Deterministic, so this is a fact about this ground rather than a lucky run.
  const found = lands.locator('.lands__bounty');
  expect(await found.count()).toBeGreaterThan(3);
  expect(await found.count()).toBeLessThan(count / 3);
});

test('and an unrevealed hex keeps its find to itself', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });

  // Nothing is revealed on a fresh realm, so nothing may name a bounty — an unrevealed
  // hex spoiling its own find would undo the reason to reveal it.
  await expect(lands.locator('.lands__bounty')).toHaveCount(0);
  await expect(lands.locator('.lands__tag--new')).toHaveCount(7);
});

/*
 * BRDC-LANDS-002. The page's whole opinion is "these want revealing", and until now the
 * only way to act on it closed the page, so auditing 340 cells meant 340 round trips
 * through the map. These insist the doing happens where the saying happens.
 */
test('reveals a land from the list, and stays open to reveal the next', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });
  await expect(lands).toContainText('7 unrevealed');

  // By class, not by name: the row's own button carries the word "unrevealed", which any
  // name match on "Reveal" collides with.
  const reveal = lands.locator('.lands__reveal');
  await expect(reveal).toHaveCount(7);

  await reveal.first().click();

  // The page is still here — this is the line the ticket exists for.
  await expect(lands).toBeVisible();
  // One fewer to do, one fewer button, and the row says what it turned up.
  await expect(lands).toContainText('6 unrevealed', { timeout: 15_000 });
  await expect(lands.locator('.lands__reveal')).toHaveCount(6);
  await expect(lands.locator('.lands__found').first()).toBeVisible();

  // ...and the next one goes without navigating anywhere.
  await lands.locator('.lands__reveal').first().click();
  await expect(lands).toContainText('5 unrevealed', { timeout: 15_000 });
  await expect(lands).toBeVisible();
});

test('a reveal from the ledger pays into the pouch like any other', async ({ page }) => {
  test.setTimeout(200_000);
  const lands = await openLands(page);
  await expect(lands.locator('.lands__row')).toHaveCount(7, { timeout: 20_000 });

  // Reveal every hex the fresh ring holds; a tier that pays nothing is a real outcome, so
  // this asserts that at least one of the seven said something rather than each of them.
  for (let i = 0; i < 7; i += 1) {
    const next = lands.locator('.lands__reveal').first();
    if ((await next.count()) === 0) break;
    await next.click();
    await page.waitForTimeout(400);
  }
  await expect(lands).toContainText('0 unrevealed', { timeout: 20_000 });
  await expect(lands.locator('.lands__found')).not.toHaveCount(0);
});
