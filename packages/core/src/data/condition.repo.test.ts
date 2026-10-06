/** BRDC-CONDITION-001 — conditions in the store: prices that fall due, a paid debt, amnesia. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { payDebt, settleConditions } from './conditionStore.js';
import { rumourApi } from './deckStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { FIRST_INVESTIGATOR } from '../rules/investigator.js';
import { gainCondition } from '../rules/condition.js';
import type { Investigator } from '../rules/investigator.js';
import type { Cell } from '../types/domain.js';
import { cellAt, cellsWithin } from '../geo/cells.js';

// Real hexes: a cell's key carries its region.
const [HOME, A, B] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1) as [string, string, string];

const T0 = Date.parse('2026-10-06T12:00:00Z');
const H = 3_600_000;
const cell = (h3: string, strength: number): Cell => ({ h3, ownerId: 'me', strength, lastVisitedAt: T0, visitDays: [] });

async function withInvestigator(inv: Investigator, cells: Cell[] = []) {
  const store = new MemoryStore();
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0, keep: { level: 1, granary: { citizens: 1, box: 0 } } });
  await store.set(K.investigator, inv);
  for (const c of cells) await store.set(K.cell(c.h3), c);
  return store;
}

describe('settleConditions', () => {
  it('an unpaid debt takes the weakest hex that is not the Hearth, and is gone', async () => {
    const cells = [cell(HOME, 1), cell(A, 300), cell(B, 120)];
    const store = await withInvestigator(gainCondition(FIRST_INVESTIGATOR(T0), 'debt', T0), cells);
    expect(await settleConditions(store, { owned: cells, home: HOME, temples: new Set() }, T0 + 71 * H)).toBeNull();
    expect(await settleConditions(store, { owned: cells, home: HOME, temples: new Set() }, T0 + 72 * H)).toBe(B);
    expect(await store.get(K.cell(B))).toBeUndefined();
    expect(await store.get(K.cell(A))).toBeDefined();
    expect((await store.get<Investigator>(K.investigator))?.conditions).toEqual([]);
  });

  it('a Dark Pact takes its sanity when it ends', async () => {
    const store = await withInvestigator(gainCondition(FIRST_INVESTIGATOR(T0), 'dark-pact', T0));
    await settleConditions(store, { owned: [], home: null, temples: new Set() }, T0 + 72 * H);
    expect((await store.get<Investigator>(K.investigator))?.sanity).toBe(FIRST_INVESTIGATOR(T0).sanity - 3);
  });
});

describe('payDebt', () => {
  it('pays from the pouch and lifts the debt; without the gold it says so', async () => {
    const store = await withInvestigator(gainCondition(FIRST_INVESTIGATOR(T0), 'debt', T0));
    expect(await payDebt(store, [], T0)).toEqual({ ok: false, refused: 'cannot-afford' });
    await writePouch(store, { ...EMPTY_POOL, gold: 80 }, T0);
    expect(await payDebt(store, [], T0)).toEqual({ ok: true });
    expect((await settlePouch(store, [], T0)).pool.gold).toBe(30);
    expect(await payDebt(store, [], T0)).toEqual({ ok: false, refused: 'no-debt' });
  });
});

describe('Amnesia', () => {
  it('a clue cannot be spent on a rumour reroll', async () => {
    const inv = { ...gainCondition(FIRST_INVESTIGATOR(T0), 'amnesia', T0), clues: 3 };
    const store = await withInvestigator(inv);
    await store.set(K.rumours, { done: [], pending: { h3: 'x', cardId: 'forest:birch-choir', roll: { faces: [1, 2], successes: 0, need: 1, pass: false, luck: 'normal' } } });
    expect(await rumourApi(() => store, async () => []).reroll(0, T0)).toEqual({ ok: false, refused: 'amnesia' });
  });
});
