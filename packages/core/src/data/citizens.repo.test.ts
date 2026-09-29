import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');

describe('keepApi', () => {
  it('a Season 1 save has no Keep, and raising refuses', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => []);
    expect(await keep.view(T0)).toBeNull();
    expect(await keep.raise(T0)).toEqual({ ok: false, refused: 'no-keep' });
  });

  it('founding gives one citizen at level 1, housing 6', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => []);
    await keep.found(T0);
    expect(await keep.view(T0)).toMatchObject({ level: 1, citizens: 1, housing: 6, box: 0, boxNeed: 29 });
  });

  it('raising pays food and stone once, and stops without Lore at level 2', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => []);
    await keep.found(T0);
    expect(await keep.raise(T0)).toEqual({ ok: false, refused: 'cannot-afford' });
    await writePouch(store, { ...EMPTY_POOL, food: 500, stone: 500 }, T0);
    expect(await keep.raise(T0)).toMatchObject({ ok: true, paid: { food: 100, stone: 50 } });
    expect((await settlePouch(store, [], T0)).pool).toMatchObject({ food: 400, stone: 450 });
    expect((await keep.view(T0))?.housing).toBe(9);
    expect(await keep.raise(T0)).toEqual({ ok: false, refused: 'at-limit' });
  });
});
