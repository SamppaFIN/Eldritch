import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { loreApi } from './loreStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { worksApi } from './worksStore.js';
import { WORKS_DEFS } from '../rules/works/defs/index.js';
import { cellAt } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');

describe('loreApi (BRDC-PROG-004)', () => {
  it('is absent on a Season 1 save', async () => {
    const store = new MemoryStore();
    const lore = loreApi(() => store, async () => []);
    expect(await lore.view(T0)).toBeNull();
    expect(await lore.study('husbandry', T0)).toEqual({ ok: false, refused: 'no-keep' });
  });

  it('studies for wisdom, three of four opens Age II, and Granaries lifts the Keep', async () => {
    const store = new MemoryStore();
    const lore = loreApi(() => store, async () => []);
    const keep = keepApi(() => store, async () => []);
    await keep.found(T0);
    await writePouch(store, { ...EMPTY_POOL, wisdom: 500, food: 2000, stone: 2000 }, T0);

    expect((await lore.view(T0))?.techs.find((t) => t.id === 'granaries')?.state).toBe('sealed');
    for (const id of ['husbandry', 'woodcraft'] as const) expect(await lore.study(id, T0)).toEqual({ ok: true, age: 1 });
    expect(await lore.study('kindling', T0)).toEqual({ ok: true, age: 2 });
    expect((await settlePouch(store, [], T0)).pool.wisdom).toBe(500 - 90);

    expect((await keep.raise(T0)).ok).toBe(true); // to 2
    expect(await keep.raise(T0)).toEqual({ ok: false, refused: 'at-limit' });
    expect(await lore.study('granaries', T0)).toEqual({ ok: true, age: 2 });
    expect((await keep.raise(T0)).ok).toBe(true); // to 3
  });
});

describe('the Age is the ceiling for a building tree (BRDC-PROG-005)', () => {
  it('a tier II node waits for Age II on a Season 2 save', async () => {
    const store = new MemoryStore();
    const farm: Cell = {
      h3: cellAt({ lat: 61.4729, lng: 23.7258 }),
      ownerId: 'me',
      strength: 100,
      lastVisitedAt: T0,
      visitDays: [],
      buildings: [{ id: 'farm', builtAt: T0 }],
    };
    await store.set(`cell:x:${farm.h3}`, farm);
    const works = worksApi(() => store, async () => 'me', async () => [farm]);
    const lore = loreApi(() => store, async () => [farm]);
    await keepApi(() => store, async () => [farm]).found(T0);
    await writePouch(store, { ...EMPTY_POOL, wisdom: 999, food: 9999, wood: 9999, stone: 9999, gold: 9999, iron: 9999, culture: 9999, mana: 9999 }, T0);

    const tiers = WORKS_DEFS.farm.tree.tiers;
    const first = tiers[0]?.nodes[0]?.id as string;
    const second = tiers[1]?.nodes[0]?.id as string;
    expect((await works.research(farm.h3, first, T0)).ok).toBe(true);
    expect(await works.research(farm.h3, second, T0)).toEqual({ ok: false, refused: 'age' });
    for (const id of ['husbandry', 'woodcraft', 'kindling'] as const) await lore.study(id, T0);
    expect((await works.research(farm.h3, second, T0)).ok).toBe(true);
  });
});
