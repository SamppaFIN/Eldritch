/**
 * BRDC-INVEST-001 — choosing the investigator, and the four abilities where they act:
 * the Keep's choice, a Watchtower's sight, a Work's price, the anomalies listed.
 */
import { describe, expect, it } from 'vitest';
import { BUILDINGS, EMPTY_POOL, FIRST_INVESTIGATOR, anomalyAt, chooseArchetype } from '@es3/core';
import type { ArchetypeId, ResourceKind } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import { investigatorApi } from './investigatorStore.js';
import { towerSight } from './towerSight.js';
import { readSighted } from './revealStore.js';
import { describeAnomalies } from './anomalyStore.js';
import { getAnomaliesFor } from './storyRepo.js';
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-05T12:00:00Z');
const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const KEEP = { level: 1, granary: { citizens: 1, box: 0 } };

const as = (id: ArchetypeId) => chooseArchetype(FIRST_INVESTIGATOR(T0), id);

describe('investigator.choose', () => {
  it('a Season 1 save has no investigator to read or choose', async () => {
    const store = new MemoryStore();
    const api = investigatorApi(() => store);
    expect(await api.view(T0)).toBeNull();
    expect(await api.choose('librarian', T0)).toEqual({ ok: false, refused: 'no-keep' });
  });

  it('chooses once, raises the skill, and is locked after', async () => {
    const store = new MemoryStore();
    await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, keep: KEEP });
    const api = investigatorApi(() => store);
    expect((await api.view(T0))?.archetype).toBeNull();
    const r = await api.choose('surveyor', T0);
    expect(r.ok && r.view.archetype?.title).toBe('The Surveyor');
    expect(r.ok && r.view.skills.observe).toBe(4);
    expect(await api.choose('medium', T0)).toEqual({ ok: false, refused: 'chosen' });
    expect((await api.view(T0))?.archetype?.id).toBe('surveyor');
  });
});

describe('the Surveyor: a Watchtower sees one ring further', () => {
  it('sights the third ring where an unstaffed tower stops at the second', async () => {
    const h3 = cellAt(ORIGIN);
    const plain = new MemoryStore();
    await towerSight(plain, h3, T0);
    const surveyor = new MemoryStore();
    await surveyor.set(K.investigator, as('surveyor'));
    await towerSight(surveyor, h3, T0);
    expect(Object.keys(await readSighted(plain))).toHaveLength(cellsWithin(h3, 2).length);
    expect(Object.keys(await readSighted(surveyor))).toHaveLength(cellsWithin(h3, 3).length);
  });
});

describe('the Dockworker: Works cost a tenth less', () => {
  it('pays the discounted price, floored per resource', async () => {
    const spent = async (who: ArchetypeId | null) => {
      const store = new MemoryStore();
      await store.set(SCHEMA_KEY, SCHEMA_VERSION);
      await store.set('resources', { pool: { ...EMPTY_POOL, wood: 999, stone: 999, gold: 999, culture: 999 }, since: T0 });
      if (who) await store.set(K.investigator, as(who));
      const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
      const home = await repo.setHome(ORIGIN, T0);
      const before = await repo.getResources(T0);
      expect((await repo.build(home, 'monument', T0)).ok).toBe(true);
      const after = await repo.getResources(T0);
      return Object.fromEntries((Object.keys(BUILDINGS.monument.cost) as ResourceKind[]).map((k) => [k, before[k] - after[k]]));
    };
    const full = await spent(null);
    expect(full).toEqual(BUILDINGS.monument.cost);
    const less = await spent('dockworker');
    for (const [k, v] of Object.entries(full)) expect(less[k]).toBe(Math.floor(v * 0.9));
  });
});

describe('the Medium: anomalies one ring beyond your ground', () => {
  // A hex with an anomaly, and a neighbour of it to hold.
  const strange = cellsWithin(cellAt(ORIGIN), 25).find((h) => anomalyAt(h) !== null) as string;
  const held: Cell = { h3: neighboursOf(strange)[0] as string, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] };
  const deps = { getProfile: async () => ({}) as never, getOwnedCells: async () => [held], getResources: async () => ({}) as never, addXp: async () => 0 };

  it('lists it, marked as seen from afar; nobody else sees it', async () => {
    expect(describeAnomalies([held], T0).some((a) => a.h3 === strange)).toBe(false);
    const store = new MemoryStore();
    await store.set(K.investigator, as('medium'));
    const seen = (await getAnomaliesFor(deps, T0, store)).find((a) => a.h3 === strange);
    expect(seen).toMatchObject({ state: 'dormant', afar: true });
    await store.set(K.investigator, as('librarian'));
    expect((await getAnomaliesFor(deps, T0, store)).some((a) => a.h3 === strange)).toBe(false);
  });
});
