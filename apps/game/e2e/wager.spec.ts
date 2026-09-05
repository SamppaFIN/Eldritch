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
  await sender.getByRole('button', { name: 'Menu' }).click();
  await sender.getByRole('button', { name: 'Retreat from the map' }).click();
  await sender.getByRole('dialog').getByRole('button', { name: 'Withdraw' }).click();
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

  // BRDC-WAGER-JSON-004: the message now names the sender ("Seeker's ground..."),
  // not a generic "Their".
  await expect(receiver.getByText(/ground is on your map/i)).toBeVisible();

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

test('ground both a Wager and your own walking claim shows shared, and lands at once', async ({
  browser,
}) => {
  // BRDC-WAGER-JSON-005: both sanctuaries founded on the same spot claim the identical
  // Hearth ring — h3 is a pure function of the fix, so this is a guaranteed overlap
  // without either side having to walk a step.
  test.setTimeout(120_000);

  const senderCtx = await browser.newContext({ permissions: ['geolocation'], geolocation: HERE });
  const sender = await senderCtx.newPage();
  await sender.goto('/');
  await sender.getByRole('button', { name: 'Begin the Awakening' }).click();
  await acceptHearth(sender, HERE);
  await expect(sender.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  await sender.getByRole('button', { name: 'Menu' }).click();
  await sender.getByRole('button', { name: 'Retreat from the map' }).click();
  await sender.getByRole('dialog').getByRole('button', { name: 'Withdraw' }).click();
  await expect(sender.getByRole('button', { name: 'The Wager' })).toBeVisible();
  await sender.getByRole('button', { name: 'The Wager' }).click();
  await sender.getByRole('button', { name: 'Seal my sanctuary' }).click();
  const challenge = await sender.getByLabel('Your challenge').inputValue();
  await senderCtx.close();

  // The receiver, at the exact same spot — accepts the Wager from the Keep rather than
  // the title screen, so they never leave the map and the import's effect on it is what
  // this test is actually watching.
  const receiverCtx = await browser.newContext({ permissions: ['geolocation'], geolocation: HERE });
  const receiver = await receiverCtx.newPage();
  await receiver.goto('/');
  await receiver.getByRole('button', { name: 'Begin the Awakening' }).click();
  await acceptHearth(receiver, HERE);
  await expect(receiver.locator('.es-player__core')).toBeVisible({ timeout: 20_000 });

  await receiver.getByRole('button', { name: 'Keep', exact: true }).click();
  const keep = receiver.getByLabel('Your sanctuary');
  await expect(keep).toBeVisible();
  await keep.getByRole('button', { name: 'The Wager' }).click();

  const dialog = receiver.getByRole('dialog', { name: 'The Wager' });
  await dialog.getByLabel('A challenge you were sent').fill(challenge);
  await dialog.getByRole('button', { name: 'Accept the Wager' }).click();
  await expect(dialog.getByText(/ground is on your map/i)).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole('button', { name: 'Done' }).click();

  // Lands at once: no walk, no reload — the map's own re-read after the accept is what
  // this polls for, tolerant only of ordinary render latency, not of a second trigger.
  const readMap = () =>
    receiver.evaluate(() => {
      const map = (
        globalThis as unknown as {
          __esMap?: {
            getSource: (id: string) => { serialize?: () => { data?: { features?: { properties?: { shared?: boolean } }[] } } } | undefined;
            hasImage: (id: string) => boolean;
          };
        }
      ).__esMap;
      const data = map?.getSource('cells')?.serialize?.().data;
      return {
        sharedFeatures: data?.features?.filter((f) => f.properties?.shared).length ?? 0,
        totalFeatures: data?.features?.length ?? 0,
        patternLoaded: map?.hasImage('cells-shared-pattern') ?? false,
      };
    });

  // The fog ring draws neighbours too, seen but not held — shared is only the seven
  // cells that are both: the identical Hearth ring, owned here and imported alike.
  await expect.poll(async () => (await readMap()).sharedFeatures, { timeout: 10_000 }).toBe(7);
  const shared = await readMap();
  expect(shared.totalFeatures).toBeGreaterThan(shared.sharedFeatures);
  expect(shared.patternLoaded).toBe(true);

  // And it is still yours — a shared cell is not a loss, so the count does not drop.
  await expect(receiver.locator('.hud__value').nth(2)).toContainText('7');

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
