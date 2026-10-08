/** BRDC-AMBITION-001 — the ambition in the store: chosen once, read from the realm, kept by the Hall. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { ambitionApi } from './ambitionStore.js';
import { legacyApi } from './legacyTally.js';
import { retireKingdom, readHallOfFame } from './hallOfFameStore.js';
import { ambitionSaid } from './ambitionStore.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell, PlayerProfile, RevealedPlace } from '../types/domain.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');
const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1);
const cells: Cell[] = hexes.map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] }));
const temples: RevealedPlace[] = hexes.slice(0, 3).map((h3) => ({ h3, kind: 'temple', dwellMs: 0, rank: 1 }));

describe('ambitionApi', () => {
  it('offers three until one is chosen, then locks it for the season', async () => {
    const store = new MemoryStore();
    const api = ambitionApi(() => store, async () => cells, async () => temples);
    expect((await api.view(T0)).choices.map((a) => a.id)).toEqual(['temples', 'gates', 'realm']);
    expect(await api.choose('gates', T0)).toEqual({ ok: true });
    expect(await api.choose('temples', T0)).toEqual({ ok: false, refused: 'locked' });
    const view = await api.view(T0);
    expect(view).toMatchObject({ choices: [], chosen: { id: 'gates' }, progress: { have: 0, need: 10 }, met: false });
  });

  it('counts sealed gates, not open ones', async () => {
    const store = new MemoryStore();
    await store.set(K.ambition, { id: 'gates', at: T0 });
    await store.set(K.gates, { gates: [{ id: '1', h3: hexes[0], openedAt: T0, sealedAt: T0 }, { id: '2', h3: hexes[1], openedAt: T0 }] });
    expect((await ambitionApi(() => store, async () => cells, async () => []).view(T0)).progress).toEqual({ have: 1, need: 10 });
  });

  it('a met ambition multiplies the Legacy tally', async () => {
    const store = new MemoryStore();
    await store.set(K.ambition, { id: 'temples', at: T0 });
    const legacy = await legacyApi(() => store, async () => cells, async () => temples).tally(T0, 'risen');
    expect(legacy.ambition).toEqual({ title: 'Keeper of Temples', met: true });
    expect(legacy.mult).toBe(1.15);
    expect(legacy.total).toBe(Math.round(legacy.subtotal * 1.15));
  });

  it('the Hall keeps the ambition through the season wipe', async () => {
    const store = new MemoryStore();
    await store.set(K.ambition, { id: 'realm', at: T0 });
    const said = await ambitionSaid(store, cells, []);
    expect(said).toBe('Lord of the Ground · not met');
    const profile = { id: 'me', name: 'Infinite', xp: 0 } as PlayerProfile;
    await retireKingdom(store, profile, cells, T0, () => 'k1', undefined, said);
    expect((await readHallOfFame(store))[0]?.ambition).toBe('Lord of the Ground · not met');
    expect(await store.get(K.ambition)).toBeUndefined();
  });
});
