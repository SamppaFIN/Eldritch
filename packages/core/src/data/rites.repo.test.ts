import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { riteApi } from './riteStore.js';
import { gateApi } from './gateStore.js';
import { loreApi } from './loreStore.js';
import { keepApi } from './citizenStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import { FIRST_INVESTIGATOR, diceFor, luckFor } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import type { RiteId } from '../rules/rites.js';
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
  const rites = riteApi(() => store, cells, () => gateApi(() => store, cells));
  const keep = keepApi(() => store, cells);
  await keep.found(T0);
  await writePouch(store, { ...EMPTY_POOL, wisdom: 999, mana: 400 }, T0);
  await loreApi(() => store, cells).study('kindling', T0);
  return { store, rites, keep };
}

describe('riteApi (BRDC-PROG-007)', () => {
  it('is absent on a Season 1 save', async () => {
    const store = new MemoryStore();
    const rites = riteApi(() => store, async () => [], () => gateApi(() => store, async () => []));
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

  /** A realm that has learned `id` at rank I, with the cooldown clear. */
  const knowing = async (id: RiteId) => {
    const r = await realm();
    await r.store.set(K.rites, { schools: ['ward', 'tide', 'whisper'], learned: { [id]: 1 }, castAt: {} });
    return r;
  };
  const cellOf = async (store: MemoryStore, h3: string) => (await store.get<Cell>(K.cell(h3)))?.strength;
  const investigator = async (store: MemoryStore) => (await store.get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(T0);

  it('Birch Ward strengthens a cell and its ring; Stone Sleep raises a cell to a floor', async () => {
    const birch = await knowing('birch-ward');
    expect(await birch.rites.cast('birch-ward', T0)).toEqual({ ok: false, refused: 'no-target' });
    expect((await birch.rites.cast('birch-ward', T0, A)).ok).toBe(true);
    expect([await cellOf(birch.store, A), await cellOf(birch.store, B)]).toEqual([130, 130]);
    const stone = await knowing('stone-sleep');
    expect((await stone.rites.cast('stone-sleep', T0, B)).ok).toBe(true);
    expect(await cellOf(stone.store, B)).toBe(200);
  });

  it('Watcher’s Calm lifts the realm’s sanity for a day', async () => {
    const { rites, keep } = await knowing('watchers-calm');
    const before = (await keep.view(T0))?.sanity ?? 0;
    expect((await rites.cast('watchers-calm', T0)).ok).toBe(true);
    expect((await keep.view(T0))?.sanity).toBe(before + 3);
    expect((await keep.view(T0 + 25 * H))?.sanity).toBeLessThan(before + 3);
  });

  it('Brackish Blessing pays mana for every cell walked in the last day; Undertow swells the pouch', async () => {
    const brackish = await knowing('brackish-blessing');
    const at = T0 + 21 * H;
    const before = (await settlePouch(brackish.store, [farm, plain], at)).pool.mana;
    expect((await brackish.rites.cast('brackish-blessing', at)).ok).toBe(true);
    expect((await settlePouch(brackish.store, [farm, plain], at)).pool.mana).toBe(before - 30 + 2);

    const under = await knowing('undertow');
    await writePouch(under.store, { ...EMPTY_POOL, wood: 100, mana: 400 }, T0);
    expect((await under.rites.cast('undertow', T0)).ok).toBe(true);
    expect((await settlePouch(under.store, [farm, plain], T0)).pool.wood).toBe(110);
  });

  it('Second Lake lifts what staffed buildings make', async () => {
    const { rites, keep } = await knowing('second-lake');
    await keep.staff(A, 'farm', 1, T0);
    const before = (await keep.view(T0))?.producedPerH ?? 0;
    expect((await rites.cast('second-lake', T0)).ok).toBe(true);
    expect((await keep.view(T0))?.producedPerH).toBeGreaterThan(before);
  });

  it('the Whisper reveals, lends dice, blesses tests and brings clues', async () => {
    const dream = await knowing('dream-sight');
    expect((await dream.rites.cast('dream-sight', T0, A)).ok).toBe(true);
    // Sight, not a find: the fog lifts, and nothing is marked revealed (2026-09-30).
    expect(Object.keys((await dream.store.get<Record<string, number>>(K.sighted)) ?? {})).toHaveLength(cellsWithin(A, 3).length);
    expect(await dream.store.get(K.revealed)).toBeUndefined();

    const voice = await knowing('borrowed-voice');
    expect((await voice.rites.cast('borrowed-voice', T0)).ok).toBe(true);
    const lent = await investigator(voice.store);
    expect(diceFor(lent, 'lore', T0)).toBe(diceFor(FIRST_INVESTIGATOR(T0), 'lore') + 1);
    expect(diceFor(lent, 'lore', T0 + 13 * H)).toBe(diceFor(FIRST_INVESTIGATOR(T0), 'lore'));

    const seed = await knowing('madness-seed');
    expect((await seed.rites.cast('madness-seed', T0)).ok).toBe(true);
    expect(luckFor(await investigator(seed.store), T0 + 5 * H)).toBe('blessed');
    expect(luckFor(await investigator(seed.store), T0 + 7 * H)).toBe('normal');

    const hollow = await knowing('hollow-clue');
    expect((await hollow.rites.cast('hollow-clue', T0)).ok).toBe(true);
    expect((await investigator(hollow.store)).clues).toBe(1);

    const tide = await knowing('the-tide-remembers');
    await tide.store.set(K.investigator, { ...FIRST_INVESTIGATOR(T0), stamina: 1, sanity: 1 });
    expect((await tide.rites.cast('the-tide-remembers', T0)).ok).toBe(true);
    expect(await investigator(tide.store)).toMatchObject({ stamina: 7, sanity: 6, clues: 1 });
  });

  it('Unseen Hand claims free ground beside yours without walking', async () => {
    const { store, rites } = await knowing('unseen-hand');
    expect((await rites.cast('unseen-hand', T0)).ok).toBe(true);
    const edge = [...new Set([...neighboursOf(A), ...neighboursOf(B)])].filter((h) => h !== A && h !== B);
    const taken = (await store.getMany<Cell>(edge.map((h) => K.cell(h)))).filter((c) => c?.ownerId === 'me');
    expect(taken).toHaveLength(3);
  });

  it('a gate rite with no gate open is refused before any mana is spent', async () => {
    const { store, rites } = await knowing('elder-sign');
    const before = (await settlePouch(store, [farm, plain], T0)).pool.mana;
    expect(await rites.cast('elder-sign', T0)).toEqual({ ok: false, refused: 'no-gate' });
    expect((await settlePouch(store, [farm, plain], T0)).pool.mana).toBe(before);
  });
});
