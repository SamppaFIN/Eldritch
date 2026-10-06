/** BRDC-EUREKA-001 — the Lore view shows each eureka, and study pays the halved price. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { loreApi } from './loreStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { loreCost } from '../rules/lore.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-06T12:00:00Z');
const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2);
const forest = (i: number): Cell => ({
  h3: hexes[i] as string, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [],
  terrain: { kind: 'forest', source: 'tiles' },
});

describe('eurekas in the Lore (BRDC-EUREKA-001)', () => {
  it('three forest hexes halve Woodcraft, in the view and at the till', async () => {
    const store = new MemoryStore();
    const cells = [forest(0), forest(1), forest(2)];
    const lore = loreApi(() => store, async () => cells);
    await keepApi(() => store, async () => cells).found(T0);
    const full = loreCost(1);
    const half = Math.floor(full / 2);
    await writePouch(store, { ...EMPTY_POOL, wisdom: half }, T0);

    const row = (await lore.view(T0))?.techs.find((t) => t.id === 'woodcraft');
    expect(row?.eureka).toEqual({ text: 'Hold 3 forest hexes', have: 3, need: 3, met: true });
    expect(row?.cost).toBe(half);
    // Husbandry wants plain ground, which this realm does not hold: full price, not affordable.
    expect((await lore.view(T0))?.techs.find((t) => t.id === 'husbandry')?.cost).toBe(full);
    expect(await lore.study('husbandry', T0)).toEqual({ ok: false, refused: 'cannot-afford' });

    expect(await lore.study('woodcraft', T0)).toEqual({ ok: true, age: 1 });
    expect((await settlePouch(store, cells, T0)).pool.wisdom).toBe(0);
  });

  it('a met eureka is announced once, and never again', async () => {
    const store = new MemoryStore();
    const cells = [forest(0), forest(1), forest(2)];
    const lore = loreApi(() => store, async () => cells);
    expect(await lore.announce(T0)).toEqual([]); // Season 1: nothing to announce
    await keepApi(() => store, async () => cells).found(T0);
    expect((await lore.announce(T0)).map((a) => a.id)).toEqual(['woodcraft']);
    expect(await lore.announce(T0 + 1)).toEqual([]);
  });
});
