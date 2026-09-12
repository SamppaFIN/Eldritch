import { expect, test } from '@playwright/test';
import { openMap as open } from './hearth.js';

/**
 * BRDC-TUTOR-001 — a mechanic opening is a moment the player actually sees.
 *
 * The unit tests prove the gates and the payment. What they cannot prove is the thing
 * that has gone wrong repeatedly in this project: the content exists and the screen never
 * shows the way to it. So this founds a Hearth and looks for the card with its own eyes.
 *
 * It also guards the failure this feature shipped with once already: a full-screen layer
 * that swallowed taps meant for the map. The backdrop must pass them through.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };

test.use({ permissions: ['geolocation'], geolocation: HERE });

test('founding the Hearth teaches the first mechanic', async ({ page }) => {
  await open(page, HERE);

  const card = page.locator('.unlock__card');
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText('The ground pays');
  // The reward is named on the button, because a lesson that pays should say so.
  await expect(card.getByRole('button', { name: /Understood/ })).toBeVisible();
});

test('the backdrop does not eat taps meant for the map', async ({ page }) => {
  await open(page, HERE);
  await expect(page.locator('.unlock__card')).toBeVisible({ timeout: 15_000 });

  // The menu sits at the top of the screen, well outside the card. With the lesson open,
  // it must still be reachable — this is the regression `opening.spec` and `guide.spec`
  // caught, where the backdrop swallowed a Build click across the whole viewport.
  //
  // The proof is that the menu opened, not that the lesson closed: the lesson has no
  // reason to close for a popover, and asserting that instead would be testing a
  // behaviour nothing promises.
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Retreat from the map' })).toBeVisible();
});

test('reading a lesson dismisses it and it does not come back', async ({ page }) => {
  await open(page, HERE);

  const card = page.locator('.unlock__card');
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: /Understood/ }).click();

  // The contract is that a lesson once read is never taught again — not that the screen
  // goes quiet. The helper nudges the player a few metres to make the fixes agree, which
  // can carry them into the next hex and legitimately open the *next* lesson. So this
  // asserts the read one is gone, across a reload, rather than that nothing is showing.
  // `toHaveCount(0)` rather than `not.toContainText`, which fails outright when there is
  // no card at all — and no card is one of the two correct outcomes here.
  await expect(page.getByText('The ground pays')).toHaveCount(0);

  /*
   * Wait for the payment to land, not for a duration.
   *
   * The card leaves optimistically, so the assertion above resolves before the store has
   * written anything — and a fixed pause was the wrong guard: it passed alone and failed
   * the moment four specs shared the machine. The founding stash carries no wisdom, so
   * the wisdom pip appearing in the pouch *is* the write, and it doubles as the only
   * end-to-end proof that reading a lesson pays for it.
   */
  const wisdom = page.locator('.hud__res[title="wisdom"]');
  await expect(wisdom).toContainText('10', { timeout: 15_000 });

  await page.reload();
  await page.waitForTimeout(4_000);
  await expect(page.getByText('The ground pays')).toHaveCount(0);
});

/*
 * The field report of 2026-09-12: "peli jää onboardingista jumiin... ilmoitus ei häviä."
 *
 * A player who has walked has several lessons satisfied at once. Answering one marked it
 * read and the next render put the next one in the same place, looking identical — so
 * "Understood" appeared to do nothing, over and over. One at a time was the rule; nothing
 * enforced a gap between them.
 */
test('answering a lesson clears the screen, even with more of them waiting', async ({ page }) => {
  test.setTimeout(200_000);
  await open(page, HERE);

  // Walk far enough that Works and the Temple are both open as well as resources: this is
  // the state the report came from, and the state the first version could not leave.
  const LEG_M = 45;
  const dLat = (m: number) => m / 111_320;
  for (let leg = 1; leg <= 4; leg += 1) {
    await page.context().setGeolocation({ ...HERE, latitude: HERE.latitude + dLat(LEG_M * leg) });
    await page.waitForTimeout(7_000);
  }

  const card = page.locator('.unlock__card');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.getByRole('button', { name: /Understood/ }).click();

  // The screen is clear, and stays clear — not replaced a second later by the next one.
  await expect(card).toBeHidden();
  await page.waitForTimeout(4_000);
  await expect(card).toBeHidden();
});

test('"Not now" also clears the screen rather than summoning the next', async ({ page }) => {
  test.setTimeout(200_000);
  await open(page, HERE);

  const card = page.locator('.unlock__card');
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: 'Not now' }).click();

  await expect(card).toBeHidden();
  await page.waitForTimeout(4_000);
  await expect(card).toBeHidden();
});

test('the first lesson points at a place that exists', async ({ page }) => {
  await open(page, HERE);
  const card = page.locator('.unlock__card');
  await expect(card).toBeVisible({ timeout: 15_000 });

  // It used to send players to "your pouch in the footer", which is a row that is hidden
  // whenever a sheet is open. The Keep is a button that is always there.
  await expect(card).toContainText('Keep');
  await expect(card).not.toContainText('footer');
});
