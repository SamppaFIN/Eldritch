/** BRDC-GREAT-001 — great people in the store: born of points, a deed used once, kept by the Hall. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { greatApi } from './greatStore.js';
import { readHallOfFame, retireKingdom } from './hallOfFameStore.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { GateApi } from './gateStore.js';
import type { BuildingId, Cell, PlayerProfile } from '../types/domain.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');
const H = 3_600_000;
const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1);
const cell = (h3: string, work?: BuildingId, at = T0): Cell => ({
  h3, ownerId: 'me', strength: 100, lastVisitedAt: at, visitDays: [], ...(work ? { buildings: [{ id: work, builtAt: 0 }] } : {}),
});
const noGates = { sealFromAfar: async () => false } as unknown as GateApi;

function realm(work: BuildingId) {
  const store = new MemoryStore();
  const owned = async (t: number) => ring.map((h3, i) => cell(h3, i === 1 ? work : undefined, t));
  const api = greatApi(() => store, owned, () => noGates);
  return { store, api };
}

describe('greatApi', () => {
  it('a Library’s hundred hours bear a Scholar, announced once', async () => {
    const { api, store } = realm('library');
    expect((await api.view(T0)).kinds.find((k) => k.kind === 'scholar')).toMatchObject({ points: 0, need: 100, perHour: 1 });
    const v = await api.view(T0 + 100 * H);
    expect(v.waiting).toHaveLength(1);
    expect(v.waiting[0]).toMatchObject({ kind: 'scholar', deedName: 'Chart the Unknown' });
    expect(v.unseen).toHaveLength(1);
    await api.markSeen(v.waiting[0]?.id as string);
    expect((await api.view(T0 + 100 * H)).unseen).toHaveLength(0);
    expect((await api.view(T0 + 100 * H)).kinds.find((k) => k.kind === 'scholar')?.need).toBe(150);
    // The Scholar's deed: three rings round the Hearth are seen, once.
    await store.set(K.home, ring[0]);
    const id = v.waiting[0]?.id as string;
    expect(await api.use(id, T0 + 101 * H)).toMatchObject({ ok: true });
    expect(Object.keys((await store.get<Record<string, number>>(K.sighted)) ?? {})).toHaveLength(37);
    expect(await api.use(id, T0 + 101 * H)).toEqual({ ok: false, refused: 'used' });
    expect((await api.view(T0 + 101 * H)).done.map((p) => p.deedName)).toEqual(['Chart the Unknown']);
  });

  it('a Mystic with no open gate keeps their deed', async () => {
    const { api } = realm('temple-grove');
    await api.view(T0); // the first read starts the clock
    const id = (await api.view(T0 + 100 * H)).waiting[0]?.id as string;
    expect(await api.use(id, T0 + 100 * H)).toEqual({ ok: false, refused: 'nothing-to-do' });
    expect((await api.view(T0 + 100 * H)).waiting).toHaveLength(1);
  });

  it('the Hall keeps whoever did their deed', async () => {
    const { api, store } = realm('library');
    await store.set(K.home, ring[0]);
    await api.view(T0);
    const id = (await api.view(T0 + 100 * H)).waiting[0]?.id as string;
    await api.use(id, T0 + 100 * H);
    await retireKingdom(store, { id: 'me', name: 'Infinite', xp: 0 } as PlayerProfile, [], T0 + 100 * H, () => 'k1');
    expect((await readHallOfFame(store))[0]?.greats).toBe('Agnes of the Drowned Stacks (Great Scholar)');
  });
});

describe('two reads crossing', () => {
  it('a read that began before a deed does not undo it', async () => {
    const { api, store } = realm('library');
    await store.set(K.home, ring[0]);
    await api.view(T0);
    const id = (await api.view(T0 + 100 * H)).waiting[0]?.id as string;
    const [, used] = await Promise.all([api.view(T0 + 100 * H), api.use(id, T0 + 100 * H)]);
    expect(used).toMatchObject({ ok: true });
    await api.view(T0 + 100 * H);
    expect((await api.view(T0 + 100 * H)).waiting).toHaveLength(0);
  });
});
