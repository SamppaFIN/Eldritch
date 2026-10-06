/** BRDC-QUEST-009 — taking and finishing tasks, through the store. */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from '@es3/core';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { taskApi } from './taskStore.js';
import type { Cell, RevealedPlace } from '../types/domain.js';

const T0 = Date.parse('2026-10-06T12:00:00Z');
const H = 3_600_000;
const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0 - H, visitDays: [], ...over });

async function setup(opts: { keep?: boolean; cells?: Cell[]; places?: RevealedPlace[] } = {}) {
  const store = new MemoryStore();
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0, ...(opts.keep ? { keep: { level: 1, granary: { citizens: 1, box: 0 } } } : {}) });
  let cells = opts.cells ?? [];
  let xp = 0;
  const api = taskApi(() => store, async () => cells, async () => opts.places ?? [], async (n) => (xp += n));
  return { store, api, setCells: (c: Cell[]) => (cells = c), xp: () => xp };
}

describe('the Tavern board', () => {
  it('a Season 1 save sees the objective tasks only', async () => {
    const s1 = await setup();
    const s2 = await setup({ keep: true });
    expect((await s1.api.board(T0)).length).toBe(7);
    expect((await s2.api.board(T0)).length).toBe(10);
    expect(await s1.api.take('grug-riddle', T0)).toEqual({ ok: false, refused: 'no-keep' });
  });

  it('take, walk, finish: paid once, and the ending kept', async () => {
    const t = await setup();
    await t.api.take('cornelius-company', T0);
    expect(await t.api.finish('cornelius-company', T0 + H)).toEqual({ ok: false, refused: 'not-ready' });
    t.setCells(['a', 'b', 'c', 'd', 'e'].map((h) => cell(h, { lastVisitedAt: T0 + H })));
    const view = (await t.api.board(T0 + H)).find((v) => v.task.id === 'cornelius-company');
    expect(view).toMatchObject({ state: 'ready', progress: { have: 5, need: 5 } });

    const r = await t.api.finish('cornelius-company', T0 + 2 * H);
    expect(r.ok && r.outcome?.status).toBe('completed');
    expect(t.xp()).toBe(60);
    expect((await t.store.get<{ pool: { food: number } }>('resources'))?.pool.food).toBe(30);
    expect(await t.api.finish('cornelius-company', T0 + 3 * H)).toEqual({ ok: false, refused: 'finished' });
    expect((await t.api.board(T0 + 3 * H)).find((v) => v.task.id === 'cornelius-company')).toMatchObject({ state: 'completed', outcome: { text: expect.stringContaining('rocks') } });
  });

  it('a skill test passed pays; failed costs sanity and is kept as failed', async () => {
    const pass = await setup({ keep: true });
    await pass.api.take('grug-riddle', T0);
    const won = await pass.api.finish('grug-riddle', T0, () => 0.99); // every die a 6
    expect(won.ok && won.outcome?.status).toBe('completed');
    expect(pass.xp()).toBe(120);

    const fail = await setup({ keep: true });
    await fail.api.take('grug-riddle', T0);
    const lost = await fail.api.finish('grug-riddle', T0, () => 0); // every die a 1
    expect(lost.ok && lost.outcome).toMatchObject({ status: 'failed', rewards: { xp: 0 } });
    expect(fail.xp()).toBe(0);
    const inv = await fail.store.get<{ sanity: number; stamina: number }>(K.investigator);
    expect(inv).toMatchObject({ sanity: 4, stamina: 6 });
  });

  it('temple days are collected as the board syncs, and count once each', async () => {
    const temple: RevealedPlace = { h3: 't', kind: 'temple', rank: 1, dwellMs: 0 };
    const t = await setup({ places: [temple] });
    await t.api.take('healing-vigil', T0);
    t.setCells([cell('t', { visitDays: ['2026-10-06'] })]);
    await t.api.sync(T0 + H);
    t.setCells([cell('t', { visitDays: ['2026-10-06', '2026-10-07'] })]);
    await t.api.sync(T0 + 25 * H);
    const view = (await t.api.board(T0 + 25 * H)).find((v) => v.task.id === 'healing-vigil');
    expect(view).toMatchObject({ state: 'ready', progress: { have: 2, need: 2 } });
  });
});
