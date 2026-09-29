import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { loreApi } from './loreStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';

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
