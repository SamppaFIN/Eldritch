import { expect, test } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-SEASON-004 — the door between seasons. With Season 2 open, a Season 1 realm must
 * retire before it plays on; with the season sealed, its close is shown and the map freezes.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify(body),
});
const season = (over: Record<string, unknown>) => ({
  n: 2, name: 'The Low Water', seed: 's2', phase: 'open', opensAt: Date.now() - 86_400_000, doom: 0, bossHp: 0, bossMaxHp: 0, ...over,
});

test('Season 2 open: a Season 1 realm is asked to retire, and cannot wave it away', async ({ page }) => {
  // The realm here was walked today, so the season "opens" tomorrow to make today's ground old.
  await page.route('**/season', (route) => route.fulfill(json(season({ opensAt: Date.now() + 2 * 86_400_000 }))));
  await openMap(page, HERE);
  const notice = page.getByRole('dialog', { name: 'Retire your kingdom to the history books' });
  await expect(notice).toBeVisible({ timeout: 20_000 });
  await expect(notice.getByRole('button', { name: 'Close' })).toHaveCount(0);
  await expect(notice.getByRole('textbox')).toHaveValue('Season 1');
  await page.keyboard.press('Escape');
  await expect(notice).toBeVisible();
  await expect(notice.getByRole('button', { name: 'Retire to the history books' })).toBeEnabled();
});

test('a sealed season shows its close and the Legacy', async ({ page }) => {
  await page.route('**/season', (route) => route.fulfill(json(season({ phase: 'sealed', outcome: 'quiet', sealedAt: Date.now() }))));
  await openMap(page, HERE);
  const close = page.getByRole('dialog', { name: 'The Lake Is Quiet' });
  await expect(close).toBeVisible({ timeout: 20_000 });
  await expect(close).toContainText('The map is frozen');
  await expect(close).toContainText('Legacy');
  // BRDC-SEASON-006: one heirloom crosses into the next season.
  await close.getByRole('button', { name: 'Keep the Foundation Stone' }).click();
  await expect(close.getByRole('button', { name: '✓ Keeping the Foundation Stone' })).toBeVisible();
});

test('a new realm joins the open season and is told its rules (BRDC-SEASON-006)', async ({ page }) => {
  await page.route('**/season', (route) => route.fulfill(json(season({}))));
  await openMap(page, HERE);
  const intro = page.getByRole('dialog', { name: 'Welcome to The Low Water' });
  await expect(intro).toBeVisible({ timeout: 20_000 });
  await expect(intro).toContainText('A building yields only while a citizen works in it.');
  await intro.getByRole('button', { name: 'Begin' }).click();
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect(page.getByLabel('Your sanctuary').getByLabel('Citizens')).toContainText('housed');
});

test('the Keep shows the season board and the Hall of Records (BRDC-SEASON-005)', async ({ page }) => {
  const counts = { cells: 0, citizens: 0, masterworks: 0, dormantMasterworks: 0, lore: 0, spellRanks: 0, gatesSealed: 9, quests: 0, wonders: 0, damage: 0, sane: false, sanity: 0, keepLevel: 0, keepStanding: false };
  await page.route('**/season', (route) => route.fulfill(json(season({ n: 1 }))));
  await page.route('**/season/legacy', (route) => route.fulfill(json({ ok: true })));
  await page.route('**/season/ages', (route) => route.fulfill(json({ ages: [] })));
  await page.route('**/season/boards?n=1', (route) =>
    route.fulfill(json({
      n: 1,
      board: [{ realm: 'x', name: 'Kaarnakuningas', legacy: 6210, counts }],
      records: [{ id: 'warden-of-doors', name: 'Warden of Doors', what: 'Most gates sealed', holder: { realm: 'x', name: 'Kaarnakuningas', value: 9 } }],
    })),
  );
  await openMap(page, HERE);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const boards = page.getByLabel('Your sanctuary').getByLabel('Season boards');
  await expect(boards).toContainText('1 · Kaarnakuningas');
  await expect(boards).toContainText('Warden of Doors — Most gates sealed: Kaarnakuningas · 9');
});

test('a ruin of last season’s Fortress can be searched once (BRDC-SEASON-007)', async ({ page }) => {
  await page.route('**/season', (route) => route.fulfill(json(season({ n: 1 }))));
  // The ruin is the hex the player stands on — the Hearth's own, found from IndexedDB.
  await openMap(page, HERE);
  const home = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open('es3');
        open.onsuccess = () => {
          const get = open.result.transaction('kv', 'readonly').objectStore('kv').get('home');
          get.onsuccess = () => resolve(get.result as string);
        };
      }),
  );
  await page.route('**/season/ruins', (route) => route.fulfill(json({ era: 'Season 1', cells: [home] })));
  await page.reload();
  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const ruin = page.getByRole('region', { name: 'Selected cell' }).getByLabel('Ruins');
  await expect(ruin).toContainText('Ruins of a Fortress', { timeout: 20_000 });
  await ruin.getByRole('button', { name: 'Search the ruins' }).click();
  await expect(ruin.getByRole('status')).not.toBeEmpty();
  await expect(ruin.getByRole('button', { name: 'Search the ruins' })).toHaveCount(0);
});

test('a wonder the realm found offers its action once a day (BRDC-SEASON-008)', async ({ page }) => {
  await openMap(page, HERE);
  // Record the Hearth's own hex as where Innsmouth was found. The app writes this key too
  // when it finds a wonder of its own, so write, reload, and write again until it holds.
  const seed = () =>
    page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const open = indexedDB.open('es3');
          open.onsuccess = () => {
            const tx = open.result.transaction('kv', 'readwrite');
            const kv = tx.objectStore('kv');
            const home = kv.get('home');
            const finds = kv.get('wonder-finds');
            tx.oncomplete = () => resolve(Boolean(finds.result?.innsmouth));
            home.onsuccess = () => {
              finds.onsuccess = () => {
                if (!finds.result?.innsmouth) kv.put({ ...(finds.result ?? {}), innsmouth: { h3: home.result, at: Date.now() } }, 'wonder-finds');
              };
            };
          };
        }),
    );
  for (let i = 0; i < 4 && !(await seed()); i += 1) await page.reload();
  await page.reload();
  await page.getByRole('button', { name: 'Here', exact: true }).click();
  const wonder = page.getByRole('region', { name: 'Selected cell' }).getByLabel('Wonder');
  await expect(wonder).toContainText('Innsmouth · The Catch.', { timeout: 20_000 });
  await wonder.getByRole('button', { name: 'Use · The Catch' }).click();
  await expect(wonder.getByRole('status')).toContainText('Gain 60 food.');
  await expect(wonder.getByRole('button', { name: 'Resting until tomorrow' })).toBeDisabled();
});
