import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { riteApi } from './riteStore.js';
import { loreApi } from './loreStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { growBox } from '../rules/balance.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const H = 3_600_000;
const A = cellAt({ lat: 61.4729, lng: 23.7258 });
const B = neighboursOf(A)[0] as string;
const farm: Cell = { h3: A, ownerId: 'me', strength: 100, lastVisitedAt: T0 + 20 * H, visitDays: [], buildings: [{ id: 'farm', builtAt: T0 }] };
const plain: Cell = { h3: B, ownerId: 'me', strength: 100, lastVisitedAt: T0 + 20 * H, visitDays: [] };

async function realm() {
  const store = new MemoryStore();
  const cells = async () => [(await store.get<Cell>(K.cell(A))) ?? farm, (await store.get<Cell>(K.cell(B))) ?? plain];
  const rites = riteApi(() => store, cells);
  const keep = keepApi(() => store, cells);
  await keep.found(T0);
  await writePouch(store, { ...EMPTY_POOL, wisdom: 999, mana: 400 }, T0);
  await loreApi(() => store, cells).study('kindling', T0);
  return { store, rites, keep };
}

describe('riteApi (BRDC-PROG-007)', () => {
  it('is absent on a Season 1 save', async () => {
    const store = new MemoryStore();
    const rites = riteApi(() => store, async () => []);
    expect(await rites.view(T0)).toBeNull();
    expect(await rites.dedicate('tide', T0)).toEqual({ ok: false, refused: 'no-keep' });
  });

  it('Kindling gives one school; its tier I rite is learned for mana and cast on a Farmstead', async () => {
    const { store, rites, keep } = await realm();
    expect((await rites.dedicate('tide', T0)).ok).toBe(true);
    expect(await rites.dedicate('ward', T0)).toEqual({ ok: false, refused: 'no-slot' });
    const view = await rites.view(T0);
    expect(view?.rites.map((r) => r.id)).toContain('call-the-shoal');
    expect(view?.rites.find((r) => r.id === 'brackish-blessing')?.state).toBe('sealed');

    expect((await rites.learn('call-the-shoal', T0)).ok).toBe(true);
    expect(await rites.cast('call-the-shoal', T0)).toEqual({ ok: false, refused: 'no-target' });
    await keep.staff(A, 'farm', 1, T0);
    const before = (await settlePouch(store, [farm, plain], T0)).pool.mana;
    expect(await rites.cast('call-the-shoal', T0, A)).toEqual({ ok: true, said: 'A Farmstead gains +4 food/h for 12 h.' });
    expect((await settlePouch(store, [farm, plain], T0)).pool.mana).toBe(before - 20);
    expect((await keep.view(T0))?.producedPerH).toBeGreaterThanOrEqual(3 + 4);
    expect(await rites.cast('call-the-shoal', T0 + H, A)).toEqual({ ok: false, refused: 'cooling' });
  });

  it('Salt Circle strengthens the cell it is cast on', async () => {
    const { store, rites } = await realm();
    await rites.dedicate('ward', T0);
    await rites.learn('salt-circle', T0);
    expect((await rites.cast('salt-circle', T0, B)).ok).toBe(true);
    expect((await store.get<Cell>(K.cell(B)))?.strength).toBe(160);
  });

  it('Drowned Harvest fills the granary by a share of the box', async () => {
    const { store, rites, keep } = await realm();
    await rites.dedicate('tide', T0);
    await store.set(K.rites, { schools: ['tide'], learned: { 'drowned-harvest': 1 }, castAt: {} });
    expect((await rites.cast('drowned-harvest', T0)).ok).toBe(true);
    expect((await keep.view(T0))?.box).toBeCloseTo(growBox(1) * 0.2);
  });
});
