import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { cellAt } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

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

describe('keepApi — staffing (BRDC-PROG-002)', () => {
  const H = 3_600_000;
  const farm: Cell = {
    h3: cellAt({ lat: 61.4729, lng: 23.7258 }),
    ownerId: 'me',
    strength: 100,
    lastVisitedAt: T0 + 10 * H,
    visitDays: [],
    buildings: [{ id: 'farm', builtAt: T0 }],
  };

  it('an unstaffed farm feeds nobody; a staffed one does', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => [farm]);
    await keep.found(T0);
    expect(await keep.staffOn(farm.h3, T0)).toEqual([{ id: 'farm', hands: 0, slots: 1 }]);
    const idle = (await keep.view(T0))?.producedPerH ?? 0;

    expect(await keep.staff(farm.h3, 'farm', 1, T0)).toEqual({ ok: true });
    expect(await keep.staff(farm.h3, 'farm', 1, T0)).toEqual({ ok: false, refused: 'no-idle' });
    const view = await keep.view(T0);
    expect(view?.idle).toBe(0);
    expect(view?.producedPerH).toBe(idle + 3);
  });

  it('refuses on a Season 1 save and on a cell without that building', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => [farm]);
    expect(await keep.staff(farm.h3, 'farm', 1, T0)).toEqual({ ok: false, refused: 'no-keep' });
    await keep.found(T0);
    expect(await keep.staff(farm.h3, 'forge', 1, T0)).toEqual({ ok: false, refused: 'none-there' });
  });
});
