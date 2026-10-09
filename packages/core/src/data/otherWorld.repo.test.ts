/** BRDC-OTHERWORLD-001 — through a gate: two encounters, the gate closed from inside, or thrown back. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { otherWorldApi } from './otherWorldStore.js';
import { gateApi } from './gateStore.js';
import { WORLDS, WORLD_IDS, journeyCards, worldOf } from '../rules/otherWorld.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { FIRST_INVESTIGATOR } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { activeConditions } from '../rules/condition.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-09T12:00:00Z');
const [HOME, GATE_HEX] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1) as [string, string];
const cells: Cell[] = [HOME, GATE_HEX].map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] }));

async function atAGate() {
  const store = new MemoryStore();
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0, keep: { level: 1, granary: { citizens: 1, box: 0 } } });
  await store.set(K.investigator, FIRST_INVESTIGATOR(T0));
  await store.set(K.gates, { gates: [{ id: 'g1', h3: GATE_HEX, openedAt: T0 }], dawn: 0, bitten: {}, outbox: [] });
  const gates = gateApi(() => store, async () => cells);
  return { store, gates, world: otherWorldApi(() => store, () => gates) };
}

describe('the worlds', () => {
  it('three worlds of three cards, a gate always opening on the same one', () => {
    expect(WORLD_IDS).toHaveLength(3);
    for (const w of WORLD_IDS) expect(WORLDS[w].cards).toHaveLength(3);
    expect(worldOf('g1')).toBe(worldOf('g1'));
    const [a, b] = journeyCards('g1');
    expect(a.id).not.toBe(b.id);
    expect(WORLDS[worldOf('g1')].cards).toContain(a);
  });
});

describe('a journey', () => {
  it('is entered only standing on the open gate, and one at a time', async () => {
    const { world } = await atAGate();
    expect(await world.enter('g1', HOME, T0)).toEqual({ ok: false, refused: 'not-there' });
    expect(await world.enter('nope', GATE_HEX, T0)).toEqual({ ok: false, refused: 'no-gate' });
    expect(await world.enter('g1', GATE_HEX, T0)).toMatchObject({ ok: true });
    expect(await world.enter('g1', GATE_HEX, T0)).toEqual({ ok: false, refused: 'travelling' });
  });

  it('two encounters passed close the gate from the inside, and the Doom hears of it', async () => {
    const { world, gates, store } = await atAGate();
    await world.enter('g1', GATE_HEX, T0);
    expect((await world.journey())?.stage).toBe(1);
    expect(await world.face(T0, () => 0.99)).toMatchObject({ ok: true, pass: true, ended: false });
    // Left half-way, the journey waits in the save.
    expect((await otherWorldApi(() => store, () => gates).journey())?.stage).toBe(2);
    expect(await world.face(T0, () => 0.99)).toMatchObject({ ok: true, pass: true, closed: true, ended: true });
    expect(await world.journey()).toBeNull();
    expect((await gates.view(T0))?.gates).toHaveLength(0);
    expect(await gates.outbox()).toEqual([{ gateId: 'g1', delta: -1 }]);
  });

  it('a failed encounter throws you back with a condition, and the gate stays open', async () => {
    const { world, gates, store } = await atAGate();
    await world.enter('g1', GATE_HEX, T0);
    const r = await world.face(T0, () => 0);
    expect(r).toMatchObject({ ok: true, pass: false, ended: true });
    const inv = (await store.get<Investigator>(K.investigator)) as Investigator;
    expect(activeConditions(inv, T0).map((c) => c.id)).toContain(journeyCards('g1')[0].fail.condition);
    expect((await gates.view(T0))?.gates).toHaveLength(1);
    expect(await world.journey()).toBeNull();
  });
});
