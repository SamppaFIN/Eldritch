/**
 * A playthrough against the dev server (5173) — founds a Hearth, imports the Sampoamaja
 * Wager, walks and claims, builds, checks the Guide and the rename. Run:
 *
 *   pnpm --filter @es3/game dev            # in one terminal
 *   node apps/game/e2e/sim.mjs             # in another
 *
 * Not a test — a check that a human could sit down and play. It logs a line per step and
 * a summary; it does not throw on a soft miss, so the whole run always reports.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
const URL = process.env.SIM_URL ?? 'http://localhost:5173';
const dir = dirname(fileURLToPath(import.meta.url));
const CHALLENGE = readFileSync(join(dir, 'fixtures/sampoamaja.json'), 'utf8');

const LEG_M = 45;
const LEG_MS = 7_000;
const dLat = (m) => m / 111_320;

const results = [];
const step = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '  ok  ' : ' MISS '} ${name}${detail ? ` — ${detail}` : ''}`);
};
const wardedCount = (page) =>
  page
    .locator('.hud__value')
    .nth(2)
    .innerText()
    .then((t) => Number.parseInt(t, 10) || 0)
    .catch(() => 0);
const rivalCells = (page) =>
  page
    .evaluate(() => {
      const m = globalThis.__esMap;
      const feats = m?.getSource('cells')?.serialize?.().data?.features ?? [];
      return feats.filter((f) => f.properties?.color === '#5c1a1a').length;
    })
    .catch(() => 0);
const pouch = (page) =>
  page
    .locator('.hud__pouch')
    .innerText()
    .then((t) => t.replace(/\s+/g, ' ').trim())
    .catch(() => '(none)');

async function acceptHearth(page) {
  await page.getByRole('heading', { name: 'Your Hearth' }).waitFor({ timeout: 15_000 });
  for (let i = 1; i <= 8; i += 1) {
    await page.context().setGeolocation({ ...HERE, latitude: HERE.latitude + i * 0.00001 });
    await page.waitForTimeout(250);
  }
  const accept = page.getByRole('button', { name: 'This ground is mine' });
  await accept.waitFor({ state: 'visible', timeout: 20_000 });
  await accept.click();
  await page.context().setGeolocation(HERE);
}

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    permissions: ['geolocation'],
    geolocation: HERE,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('  !! page error:', e.message));

  try {
    await page.goto(URL, { waitUntil: 'load', timeout: 30_000 });
    step('dev server reachable', true, URL);

    await page.getByRole('button', { name: 'Begin the Awakening' }).click();
    await acceptHearth(page);
    await page.locator('.es-player__core').waitFor({ state: 'visible', timeout: 20_000 });
    step('founded a Hearth', true);

    await page.waitForTimeout(2_000);
    step('the world has resources', true, `pouch: ${await pouch(page)}`);

    // --- Import the Wager -------------------------------------------------
    await page.getByRole('button', { name: 'Keep', exact: true }).click();
    const keep = page.getByLabel('Your sanctuary');
    await keep.waitFor({ state: 'visible', timeout: 10_000 });
    await keep.getByRole('button', { name: 'The Wager' }).click();
    const dialog = page.getByRole('dialog', { name: 'The Wager' });
    await dialog.getByLabel('A challenge you were sent').fill(CHALLENGE);
    await dialog.getByRole('button', { name: 'Accept the Wager' }).click();
    // The real outcome is the rival ground appearing — poll for it (a cold dev server
    // takes a few seconds to first-compile the import path). The message is best-effort.
    let rivals = 0;
    for (let t = 0; t < 25 && rivals === 0; t += 1) {
      await page.waitForTimeout(1_000);
      rivals = await rivalCells(page);
    }
    const msg = await dialog
      .getByText(/ground is on your map/i)
      .innerText()
      .then((s) => s.replace(/\s+/g, ' ').trim())
      .catch(() => '(no message shown)');
    step('accepted the Sampoamaja Wager', rivals > 0, msg);
    await dialog.getByRole('button', { name: 'Done' }).click().catch(() => {});
    step('rival ground is drawn on the map', rivals > 0, `${rivals} enemy-red cells in view`);

    // --- Build on the Hearth, before walking off it -------------------
    await page.getByRole('button', { name: 'Here' }).click();
    const card = page.getByRole('region', { name: 'Selected cell' });
    await card.waitFor({ state: 'visible', timeout: 8_000 });
    const ownerLine = (await card.locator('.cell-panel__owner').innerText().catch(() => '')).trim();

    const pouchStone = () =>
      page
        .evaluate(async () => {
          const db = await new Promise((res) => {
            const r = indexedDB.open('es3', 1);
            r.onsuccess = () => res(r.result);
          });
          const rs = await new Promise((res) => {
            const rq = db.transaction('kv', 'readonly').objectStore('kv').get('resources');
            rq.onsuccess = () => res(rq.result);
          });
          return rs?.pool?.stone ?? -1;
        })
        .catch(() => -1);

    let built = false;
    const stoneBefore = await pouchStone();
    const monRow = card.locator('.cell-panel__build-row', { hasText: 'Monument' });
    const buildBtn = monRow.getByRole('button', { name: 'Build', exact: true });
    if (await buildBtn.isVisible().catch(() => false)) {
      await buildBtn.click();
      await card
        .getByText(/Standing here/i)
        .waitFor({ timeout: 8_000 })
        .catch(() => {});
      built = await card.locator('.cell-panel__build-has').isVisible().catch(() => false);
    }
    step('built a Monument on the Hearth', built, `owner line: "${ownerLine}"`);
    await page.waitForTimeout(2_000);
    const stoneAfter = await pouchStone();
    step(
      'the build charged the pouch (BRDC-ECON-006)',
      stoneAfter === stoneBefore - 60,
      `stone ${stoneBefore} -> ${stoneAfter}`,
    );
    await card.getByRole('button', { name: 'Close' }).click().catch(() => {});
    await page.waitForTimeout(1_500); // let afterSpend's territory refresh settle

    // --- Walk and claim ------------------------------------------------
    const before = await wardedCount(page);
    await page.waitForTimeout(LEG_MS);
    for (let leg = 1; leg <= 4; leg += 1) {
      await page.context().setGeolocation({ ...HERE, latitude: HERE.latitude + dLat(LEG_M * leg) });
      await page.waitForTimeout(LEG_MS);
      const ng = page.getByRole('heading', { name: 'New ground' });
      if (await ng.isVisible().catch(() => false)) {
        await page
          .getByRole('button', { name: /Keep walking|Close|Dismiss/ })
          .first()
          .click()
          .catch(() => {});
      }
    }
    await page.waitForTimeout(2_000);
    const after = await wardedCount(page);
    step('walking claimed new ground', after > before, `warded ${before} -> ${after}`);
    await page.context().setGeolocation(HERE);

    // --- The Guide reflects it ---------------------------------------
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: 'Guide', exact: true }).click();
    const guide = page.getByRole('region', { name: 'Guide' });
    await guide.waitFor({ state: 'visible', timeout: 8_000 });
    await guide.getByRole('button', { name: 'Monument', exact: true }).click();
    const monPage = page.getByRole('region', { name: 'Monument' });
    await monPage.waitFor({ state: 'visible', timeout: 6_000 });
    // The live line waits on an async getOwnedCells fetch — poll a few seconds for it.
    let status = '(none)';
    for (let t = 0; t < 8; t += 1) {
      status = (await monPage.locator('.help-panel__status').innerText().catch(() => '')).trim();
      if (/Held on/.test(status)) break;
      await page.waitForTimeout(1_000);
    }
    step('the Guide shows the Monument as held', /Held on/.test(status), status);
    await page.keyboard.press('Escape');

    // --- Rename (the fix from this session) -------------------------
    await page.getByRole('button', { name: 'You' }).click();
    const name = page.getByLabel('Name', { exact: true });
    await name.waitFor({ state: 'visible', timeout: 6_000 });
    await page.waitForTimeout(500);
    await name.fill('Aavistus');
    await page.waitForTimeout(300);
    await name.press('Enter');
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'You' }).click();
    await page.getByLabel('Name', { exact: true }).waitFor({ state: 'visible' });
    const finalName = await page.getByLabel('Name', { exact: true }).inputValue();
    step('renamed the player, and it stuck', finalName === 'Aavistus', `field reads "${finalName}"`);

    await page.screenshot({ path: join(dir, '../../..', 'sim-final.png'), fullPage: false });
  } catch (err) {
    step('run completed without a fatal error', false, String(err?.message ?? err));
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} steps ok`);
  process.exit(passed === results.length ? 0 : 1);
};

run();
