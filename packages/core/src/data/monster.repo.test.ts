/** BRDC-MONSTER-001 — a creature out of a gate walks on the Keep, bites once per hex, and can be stopped. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { monsterApi } from './monsterStore.js';
import { MONSTER_BITE, MONSTER_LIFE_DAYS, creatureAt, releases } from '../rules/monster.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { FIRST_INVESTIGATOR } from '../rules/investigator.js';
import { cellAt, cellsWithin, hexDistance } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-09T12:00:00Z');
const DAY = 86_400_000;
const HOME = cellAt({ lat: 61.4729, lng: 23.7258 });
const FAR = cellsWithin(HOME, 4).find((h) => hexDistance(h, HOME) === 4) as string;
const gateId = Array.from({ length: 50 }, (_, i) => `g${i}`).find(releases) as string;
const quiet = Array.from({ length: 50 }, (_, i) => `g${i}`).find((id) => !releases(id)) as string;
const gate = { id: gateId, h3: FAR, openedAt: T0 };

describe('creatureAt', () => {
  it('about one gate in two lets something out', () => {
    const share = Array.from({ length: 400 }, (_, i) => releases(`gate-${i}`)).filter(Boolean).length / 400;
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(0.6);
    expect(creatureAt({ ...gate, id: quiet }, HOME, T0)).toBeNull();
  });
  it('walks a ring a day toward the Keep, stops there, and is gone after a week', () => {
    expect(creatureAt(gate, HOME, T0)?.h3).toBe(FAR);
    expect(hexDistance(creatureAt(gate, HOME, T0 + 2 * DAY)?.h3 as string, HOME)).toBe(2);
    expect(creatureAt(gate, HOME, T0 + 5 * DAY)).toMatchObject({ h3: HOME, arrived: true });
    expect(creatureAt(gate, HOME, T0 + MONSTER_LIFE_DAYS * DAY)).toBeNull();
    expect(creatureAt(gate, null, T0)).toBeNull();
  });
});

describe('monsterApi', () => {
  async function realm() {
    const store = new MemoryStore();
    await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0, keep: { level: 1, granary: { citizens: 1, box: 0 } } });
    await store.set(K.home, HOME);
    await store.set(K.investigator, FIRST_INVESTIGATOR(T0));
    await store.set(K.gates, { gates: [gate], dawn: 0, bitten: {}, outbox: [] });
    const cells: Cell[] = cellsWithin(HOME, 1).map((h3) => ({ h3, ownerId: 'me', strength: 200, lastVisitedAt: T0, visitDays: [] }));
    for (const c of cells) await store.set(K.cell(c.h3), c);
    const owned = async () => Promise.all(cells.map(async (c) => (await store.get<Cell>(K.cell(c.h3))) as Cell));
    return { store, api: monsterApi(() => store, owned) };
  }

  it('is under the fog far out, seen near your ground, and bites each of your hexes once', async () => {
    const { store, api } = await realm();
    expect((await api.view(T0))[0]?.visible).toBe(false);
    const at = await api.view(T0 + 4 * DAY);
    expect(at[0]?.visible).toBe(true);
    const bittenHex = at[0]?.h3 as string;
    expect((await store.get<Cell>(K.cell(bittenHex)))?.strength).toBe(200 - MONSTER_BITE);
    await api.view(T0 + 4 * DAY);
    expect((await store.get<Cell>(K.cell(bittenHex)))?.strength).toBe(200 - MONSTER_BITE);
  });

  it('is faced only on its own hex; stopped, it walks no more', async () => {
    const { api } = await realm();
    const where = (await api.view(T0 + 3 * DAY))[0]?.h3 as string;
    expect(await api.face(gateId, HOME, T0 + 3 * DAY)).toEqual({ ok: false, refused: 'not-there' });
    expect(await api.face(gateId, where, T0 + 3 * DAY, () => 0.99)).toMatchObject({ ok: true, pass: true });
    expect(await api.view(T0 + 4 * DAY)).toEqual([]);
  });
});
