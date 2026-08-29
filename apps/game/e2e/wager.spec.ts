import { expect, test } from '@playwright/test';
import { acceptHearth } from './hearth.js';

/**
 * BRDC-WAGER-JSON-001, end to end: two sanctuaries in two browser contexts, and a block
 * of text carried between them by hand — which is exactly what a player does with it.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

test('a challenge is sealed and can be copied out', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'The Wager' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Seal my sanctuary' }).click();

  const payload = dialog.getByLabel('Your challenge');
  await expect(payload).toBeVisible();

  const text = await payload.inputValue();
  const parsed = JSON.parse(text);
  expect(parsed).toMatchObject({ v: 2, defence: 'wall' });
  expect(typeof parsed.sum).toBe('string');
});

test('the border defence travels with the challenge', async ({ page }) => {
  // Both phones compute the same fight from the same inputs, so a defence the other
  // side cannot see would make the two of them disagree with no referee to ask.
  await page.goto('/');
  await page.getByRole('button', { name: 'The Wager' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: 'Orcs' }).click();
  await dialog.getByRole('button', { name: 'Seal my sanctuary' }).click();

  const sealed = JSON.parse(await dialog.getByLabel('Your challenge').inputValue());
  expect(sealed.defence).toBe('orcs');
});

test('a challenge from another sanctuary lands on the map', async ({ browser }) => {
  test.setTimeout(120_000);

  // The sender: a second game, on a different street, that has actually been walked.
  const senderCtx = await browser.newContext({
    permissions: ['geolocation'],
    geolocation: { ...HERE, longitude: HERE.longitude + 0.006 },
  });
  const sender = await senderCtx.newPage();
  await sender.goto('/');
  await sender.getByRole('button', { name: 'Begin the Awakening' }).click();
  await acceptHearth(sender, { ...HERE, longitude: HERE.longitude + 0.006 });
  await expect(sender.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  /*
   * Back to the title the way a player gets there: by ending the walk. Reloading resumes
   * straight into the map — which is right for someone whose phone dropped the page mid
   * lap, and means the Wager is reached after a walk rather than during one.
   */
  await sender.getByRole('button', { name: 'Withdraw' }).click();
  await sender.getByRole('button', { name: 'Withdraw', exact: true }).nth(1).click();
  await expect(sender.getByRole('button', { name: 'The Wager' })).toBeVisible();

  await sender.getByRole('button', { name: 'The Wager' }).click();
  await sender.getByRole('button', { name: 'Seal my sanctuary' }).click();
  const challenge = await sender.getByLabel('Your challenge').inputValue();
  await senderCtx.close();

  expect(JSON.parse(challenge).cells.length).toBeGreaterThan(0);

  // The receiver, who has never met them.
  const receiverCtx = await browser.newContext({ permissions: ['geolocation'], geolocation: HERE });
  const receiver = await receiverCtx.newPage();
  await receiver.goto('/');
  await receiver.getByRole('button', { name: 'The Wager' }).click();

  await receiver.getByLabel('A challenge you were sent').fill(challenge);
  await receiver.getByRole('button', { name: 'Accept the Wager' }).click();

  await expect(receiver.getByText(/Their ground is on your map/i)).toBeVisible();

  // And the Wager resolves on this phone, from the message alone. No result is sent
  // back, because a result is a claim and a claim is a thing to be lied about.
  // The duel is replayed round by round, with both sides' might as progress bars that
  // carry their value to assistive tech rather than only to the eye.
  await expect(receiver.locator('.fight__bar-track').first()).toBeVisible();
  await expect(receiver.locator('.fight__verdict-line')).toBeVisible({ timeout: 15_000 });
  await expect(receiver.getByText(/Their game will read the same result/i)).toBeVisible();

  // And a challenge is spent once fought — otherwise a loser walks round the block,
  // which changes the seed, and imports the same message until they win.
  await receiver.getByRole('button', { name: 'Accept the Wager' }).click();
  await expect(receiver.getByText(/already fought this one/i)).toBeVisible();

  await receiverCtx.close();
});

test('a damaged message says what to do about it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'The Wager' }).click();

  await page.getByLabel('A challenge you were sent').fill('half a message {');
  await page.getByRole('button', { name: 'Accept the Wager' }).click();

  // Not a stack trace and not silence: what the player should do next.
  await expect(page.getByText(/Copy the message again|not a challenge/i)).toBeVisible();
});
