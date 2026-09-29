import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { keepApi, titheAtKeep } from './citizenStore.js';
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
    expect(await keep.view(T0)).toMatchObject({ level: 1, citizens: 1, housing: 6, box: 0, boxNeed: 29, nextCellCulture: 11 });
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

describe('the 12-hour stores and the tithe (BRDC-PROG-002)', () => {
  const H = 3_600_000;
  const wood: Cell = {
    h3: cellAt({ lat: 61.4729, lng: 23.7258 }),
    ownerId: 'me',
    strength: 100,
    lastVisitedAt: T0 + 40 * H,
    visitDays: [],
    buildings: [{ id: 'sawmill', builtAt: T0 }],
  };
  const timberAt = async (store: MemoryStore, t: number) => (await settlePouch(store, [wood], t)).pool.wood;

  it('production stops 12 h after the last collection, and walking to the Keep restarts it', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => [wood]);
    await keep.found(T0);
    // A full granary, so the one sawyer does not starve and walk off the job in six hours.
    const r = await store.get<{ keep: { granary: { box: number } } }>('resources');
    if (r) await store.set('resources', { ...r, keep: { ...r.keep, granary: { ...r.keep.granary, box: 200 } } });
    await keep.staff(wood.h3, 'sawmill', 1, T0);
    const at12 = await timberAt(store, T0 + 12 * H);
    expect(at12).toBeGreaterThan(0);
    expect(await timberAt(store, T0 + 30 * H)).toBe(at12); // asleep: nothing more
    expect(await titheAtKeep(store, [wood], T0 + 30 * H)).toBe(true);
    expect(await timberAt(store, T0 + 32 * H)).toBeGreaterThan(at12); // the hours asleep are not back-paid
    expect(await timberAt(store, T0 + 32 * H)).toBeLessThan(at12 * 2);
  });

  it('a Season 1 save has no tithe and never sleeps', async () => {
    const store = new MemoryStore();
    expect(await titheAtKeep(store, [wood], T0)).toBe(false);
  });
});
