/**
 * BRDC-AERODROME-001 — the Skyward Runway: a sequel that opens after the Fuming Lake, its
 * own stops on the map, and the propeller it leaves in hand.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from '../rules/terrain.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import { AIRFIELD_PATH, visibleAdventureSites } from './questSites.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-08T12:00:00Z');

async function realm(fumingDone: boolean) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, mana: 100 }, since: T0, sinceDay: T0 });
  if (fumingDone) await store.set(K.adventures, { 'fuming-lake': { stage: 'servitude', done: true } });
  // Fifteen hexes of your own: the runway asks for them.
  for (const h3 of cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2).slice(0, 15)) {
    await store.set(K.cell(h3), { h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] } as Cell);
  }
  return { store, repo: new MockRepository({ store, newId: () => 'me', seed: 7 }) };
}

describe('the Skyward Runway', () => {
  it('is not on the shelf, and will not begin, before the Fuming Lake is finished', async () => {
    const { repo } = await realm(false);
    expect((await repo.getAdventures(T0)).map((a) => a.id)).toEqual(['fuming-lake']);
    expect(await repo.startAdventure('skyward-runway', T0)).toEqual({ ok: false, refused: 'locked' });
  });

  it('opens after it, walks its five stops, and leaves the propeller in hand', async () => {
    const { repo, store } = await realm(true);
    const shelf = await repo.getAdventures(T0);
    expect(shelf.find((a) => a.id === 'skyward-runway')?.state).toBe('available');
    expect(visibleAdventureSites(shelf, [])).toEqual(['statue', 'lake', 'hermit', 'troll', 'deep', 'hangar']);

    expect(await repo.startAdventure('skyward-runway', T0)).toEqual({ ok: true });
    const steps = [0, 0, 0, 0, 0]; // hangar → tower → windsock → runway → sky-gate → end
    let last;
    for (const i of steps) last = await repo.chooseInAdventure('skyward-runway', i, T0);
    expect(last).toMatchObject({ ok: true, ended: true });
    const done = (await repo.getAdventures(T0)).find((a) => a.id === 'skyward-runway');
    expect(done?.state).toBe('done');
    expect(done?.outcome?.status).toBe('completed');
    expect(visibleAdventureSites(await repo.getAdventures(T0), [])).toEqual(expect.arrayContaining([...AIRFIELD_PATH]));

    expect(await repo.propeller.charges()).toBe(1);
    expect(await repo.propeller.use(T0)).toEqual({ ok: false, refused: 'nothing-to-do' });
    expect(await repo.propeller.charges()).toBe(1);
    expect(await store.get(K.propeller)).toEqual({ charges: 1 });
  });
});
