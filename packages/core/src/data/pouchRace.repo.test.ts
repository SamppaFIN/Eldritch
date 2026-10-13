/**
 * BRDC-ECON-010 — two pouch writes at once must both land.
 *
 * A spend or a gain used to settle, work out the new pool and write it whole — so a gain
 * and a spend in the same moment put one another back: the reward vanished, or the price
 * was never paid.
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { grantBonus, writePouch } from './pouch.js';
import { wardWith } from './pouchSpend.js';
import { WARD_COST } from '../rules/ward.js';
import type { ResourceState } from '../rules/terrain.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { cellAt } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-13T12:00:00Z');
const read = async (store: MemoryStore) => ((await store.get<ResourceState>('resources')) as ResourceState).pool;
const cell: Cell = { h3: cellAt({ lat: 61.4729, lng: 23.7258 }), ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] };

describe('pouch writes that overlap', () => {
  it('a reward and a purchase in the same moment both count', async () => {
    // Each reads the pouch, then writes: read, read, write, write — the second write used
    // to put the first one's change back.
    const store = new MemoryStore();
    await store.set('resources', { pool: { ...EMPTY_POOL, wood: 100 }, since: T0, sinceDay: T0 });
    const [, warded] = await Promise.all([grantBonus(store, [cell], { gold: 30 }, T0), wardWith(store, cell, 'me', [cell], T0)]);
    expect(warded.warded).toBe(true);
    const pool = await read(store);
    expect(pool.gold).toBe(30);
    expect(pool.wood).toBe(100 - (WARD_COST.wood ?? 0));
  });

  it('never takes a resource below zero', async () => {
    const store = new MemoryStore();
    await store.set('resources', { pool: { ...EMPTY_POOL, wood: 10 }, since: T0, sinceDay: T0 });
    await writePouch(store, { ...EMPTY_POOL, wood: 40 }, { ...EMPTY_POOL, wood: 0 }, T0);
    expect((await read(store)).wood).toBe(0);
  });
});
