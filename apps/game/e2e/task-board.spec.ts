import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openMap } from './hearth.js';

/**
 * BRDC-QUEST-009 — the Tavern board carries tasks: take one and it stays taken; a
 * finished one is dimmed and sealed with its ending, through a reload.
 */
const HERE = { latitude: 61.47290805, longitude: 23.72588249, accuracy: 8 };
test.use({ permissions: ['geolocation'], geolocation: HERE });

/** A Tavern on the Hearth hex, and (optionally) a task book — both rarely written by the app. */
async function seed(page: Page, tasks?: unknown) {
  await page.evaluate((book) => new Promise<void>((resolve) => {
    const open = indexedDB.open('es3');
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      const kv = tx.objectStore('kv');
      if (book) kv.put(book, 'tasks');
      const home = kv.get('home');
      home.onsuccess = () => {
        const cursor = kv.openCursor();
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (!c) return;
          if (String(c.key).startsWith('cell:') && String(c.key).endsWith(`:${home.result}`)) {
            c.update({ ...c.value, buildings: [{ id: 'tavern', builtAt: Date.now() }] });
            return;
          }
          c.continue();
        };
      };
      tx.oncomplete = () => { open.result.close(); resolve(); };
    };
  }), tasks);
}

async function board(page: Page) {
  for (let i = 0; i < 3; i += 1) {
    const n = page.getByRole('button', { name: 'Not now' }).first();
    if (await n.isVisible().catch(() => false)) await n.click();
  }
  await page.getByRole('button', { name: 'Here', exact: true }).click();
  return page.getByRole('region', { name: 'Selected cell' }).getByRole('list', { name: 'Tasks' });
}

test('the Tavern board offers tasks, keeps a taken one, and seals a finished one', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  const done = Date.now();
  await seed(page, {
    taken: { 'cornelius-company': { at: done - 3_600_000 }, 'aurora-errand': { at: done } },
    outcomes: { 'cornelius-company': { status: 'completed', rewards: { xp: 60, pool: { food: 30 } }, text: 'Cornelius nods at each name you give him, and tells the rocks. The rocks are thrilled.', completedAt: done } },
  });
  await page.reload();

  const tasks = await board(page);
  await expect(tasks).toContainText('Apologetic Signage', { timeout: 20_000 });
  // A Season 1 save: the objective tasks only, no skill tests — and the Drowned Choir's first step (BRDC-CHOIR-001).
  // Seven open, and the one finished folded under "Done (1)" (BRDC-UX-008).
  await expect(tasks.getByRole('listitem')).toHaveCount(8);
  await tasks.getByText('Done (1)').click();

  const sealed = tasks.locator('.task-board__task').filter({ hasText: 'Cornelius Needs Company' });
  await expect(sealed).toHaveClass(/task-board__task--closed/);
  await expect(sealed).toContainText('The rocks are thrilled.');
  await expect(sealed).toContainText('+60 XP');

  const signage = tasks.getByRole('listitem').filter({ hasText: 'Apologetic Signage' });
  await signage.getByRole('button', { name: 'Take it' }).click();
  await expect(signage).toContainText('0 / 1');
  await expect(signage.getByRole('button')).toHaveCount(0);
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/task-board.png' });

  await page.reload();
  const again = await board(page);
  await expect(again.getByRole('listitem').filter({ hasText: 'Apologetic Signage' })).toContainText('0 / 1', { timeout: 20_000 });
  await again.getByText('Done (1)').click();
  await expect(again.locator('.task-board__task').filter({ hasText: 'Cornelius Needs Company' })).toHaveClass(/task-board__task--closed/);
});

test('the Drowned Choir’s tale hangs on the board a step at a time (BRDC-CHOIR-001)', async ({ page }) => {
  test.setTimeout(150_000);
  await openMap(page, HERE);
  const done = Date.now();
  await seed(page, {
    taken: { 'choir-1-listen': { at: done - 3_600_000 } },
    outcomes: { 'choir-1-listen': { status: 'completed', rewards: { xp: 60, pool: { wisdom: 20 } }, text: 'Nowhere. You can hear them everywhere.', completedAt: done } },
  });
  await page.reload();

  const tasks = await board(page);
  await expect(tasks).toContainText('The Drowned Choir II · Study', { timeout: 20_000 });
  await expect(tasks).toContainText('Something on your ground keeps time for them.');
  await expect(tasks).not.toContainText('The Drowned Choir III');
  await tasks.getByText('The Drowned Choir II · Study').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/c--Projects-Klitoritari-FinalFantasy/27bd54f7-66d3-41b5-b027-226ec7e8fb2b/scratchpad/choir.png' });
});
