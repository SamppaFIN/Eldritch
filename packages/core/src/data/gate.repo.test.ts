import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { gateApi } from './gateStore.js';
import { keepApi } from './citizenStore.js';
import { K } from './keys.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { GATE_DOOM_MS } from '../rules/gate.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T09:00:00Z');
const DAY = 86_400_000;
const held: Cell[] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1).map((h3) => ({
  h3, ownerId: 'me', strength: 300, lastVisitedAt: T0, visitDays: [],
}));
/** Faces for the dice, in order. */
const faces = (...f: number[]) => {
  let i = 0;
  return () => ((f[i++ % f.length] as number) - 1) / 6 + 0.01;
};

async function realm() {
  const store = new MemoryStore();
  for (const c of held) await store.set(K.cell(c.h3), c);
  const cells = async () => Promise.all(held.map(async (c) => (await store.get<Cell>(K.cell(c.h3))) as Cell));
  const gates = gateApi(() => store, cells);
  await keepApi(() => store, cells).found(T0);
  return { store, gates };
}

/** A season seed whose first days open a gate near this realm. */
async function withGate() {
  const r = await realm();
  for (let s = 0; s < 50; s += 1) {
    await r.store.delete(K.gates);
    await r.gates.sync({ seed: `s${s}`, opensAt: T0 - 2 * DAY }, 'me', T0);
    const v = await r.gates.view(T0);
    if (v && v.gates.length > 0) return { ...r, gate: v.gates[0] as NonNullable<typeof v.gates[0]> };
  }
  throw new Error('no seed opened a gate');
}

describe('gateApi (BRDC-DOOM-002)', () => {
  it('is absent on a Season 1 save', async () => {
    const store = new MemoryStore();
    expect(await gateApi(() => store, async () => []).view(T0)).toBeNull();
  });

  it('opens a gate at a dawn, just outside the border, and it weighs on sanity', async () => {
    const { gate, store } = await withGate();
    expect(gate.rings).toBeGreaterThanOrEqual(1);
    const pouch = await store.get<{ keep: { gatesNear?: number } }>('resources');
    expect(pouch?.keep.gatesNear).toBeGreaterThanOrEqual(gate.rings <= 3 ? 1 : 0);
  });

  it('a test must be taken standing on the gate; a pass seals it and tells the Doom', async () => {
    const { gates, gate } = await withGate();
    expect(await gates.attempt(gate.id, null, T0)).toEqual({ ok: false, refused: 'not-there' });
    const r = await gates.attempt(gate.id, gate.h3, T0, faces(6, 5, 1, 1, 1));
    expect(r).toMatchObject({ ok: true, roll: { successes: 2, pass: true } });
    expect(await gates.accept(T0)).toMatchObject({ ok: true, sealed: true });
    const v = await gates.view(T0);
    expect(v?.gates.find((g) => g.id === gate.id)).toBeUndefined();
    expect(v?.investigator).toMatchObject({ stamina: 6, clues: 2 });
    expect(await gates.outbox()).toEqual([{ gateId: gate.id, delta: -1 }]);
    await gates.delivered([gate.id]);
    expect(await gates.outbox()).toEqual([]);
  });

  it('a clue rerolls a die; a failed test costs two sanity and leaves the gate open', async () => {
    const { gates, gate, store } = await withGate();
    await store.set(K.investigator, { stamina: 7, sanity: 6, clues: 1, skills: { lore: 3, will: 2, fight: 2, observe: 2 }, restedAt: T0 });
    await gates.attempt(gate.id, gate.h3, T0, faces(6, 1, 1, 1, 1));
    expect(await gates.reroll(1, T0, faces(2))).toMatchObject({ ok: true, roll: { pass: false } });
    expect(await gates.reroll(2, T0)).toEqual({ ok: false, refused: 'no-clues' });
    expect(await gates.accept(T0)).toMatchObject({ ok: true, sealed: false });
    const v = await gates.view(T0);
    expect(v?.investigator).toMatchObject({ sanity: 4, clues: 0 });
    expect(v?.gates.some((g) => g.id === gate.id)).toBe(true);
  });

  it('left open 48 h, a gate adds one to the Doom — once', async () => {
    const { gates, gate } = await withGate();
    await gates.sync({ seed: gate.id.split(':')[0] as string, opensAt: T0 - 2 * DAY }, 'me', gate.openedAt + GATE_DOOM_MS);
    await gates.sync({ seed: gate.id.split(':')[0] as string, opensAt: T0 - 2 * DAY }, 'me', gate.openedAt + GATE_DOOM_MS + 1_000);
    expect((await gates.outbox()).filter((o) => o.gateId === gate.id && o.delta === 1)).toHaveLength(1);
  });
});
