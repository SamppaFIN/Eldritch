/** BRDC-INVEST-002 — an investigator's own tale, a step at a time, and the weakness that comes with low sanity. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { taskApi } from './taskStore.js';
import { settleConditions } from './conditionStore.js';
import { retireKingdom } from './hallOfFameStore.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { FIRST_INVESTIGATOR } from '../rules/investigator.js';
import { chooseArchetype, ARCHETYPES } from '../rules/archetype.js';
import { hasCondition } from '../rules/condition.js';
import { PERSONAL_TASKS } from '../rules/personalTasks.js';
import type { Investigator } from '../rules/investigator.js';
import type { PlayerProfile } from '../types/domain.js';

const T0 = Date.parse('2026-10-06T12:00:00Z');

async function realm(inv: Investigator) {
  const store = new MemoryStore();
  await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0, keep: { level: 1, granary: { citizens: 1, box: 0 } } });
  await store.set(K.investigator, inv);
  const api = taskApi(() => store, async () => [], async () => [], async () => 0);
  return { store, api };
}

describe('the tales', () => {
  it('every archetype has three steps in order, the last one the finale', () => {
    for (const a of ARCHETYPES) {
      const steps = PERSONAL_TASKS.filter((t) => t.personal === a.id);
      expect(steps).toHaveLength(3);
      expect(steps[1]?.after).toBe(steps[0]?.id);
      expect(steps[2]?.after).toBe(steps[1]?.id);
      expect(steps.map((t) => Boolean(t.finale))).toEqual([false, false, true]);
    }
  });

  it('only the first step is open, and only to its own archetype', async () => {
    const { api } = await realm(chooseArchetype(FIRST_INVESTIGATOR(T0), 'medium'));
    expect((await api.personal(T0)).map((v) => v.task.id)).toEqual(['elias-1']);
    expect(await api.take('elias-2', T0)).toEqual({ ok: false, refused: 'not-yours' });
    expect(await api.take('agnes-1', T0)).toEqual({ ok: false, refused: 'not-yours' });
  });

  it('a passed step opens the next; the finale raises the skill and the Hall remembers it', async () => {
    const { store, api } = await realm(chooseArchetype(FIRST_INVESTIGATOR(T0), 'dockworker'));
    // Step one is a walk, marked done the way the board would; step two is a test.
    await store.set(K.tasks, { taken: {}, outcomes: { 'mara-1': { status: 'completed', rewards: { xp: 0, pool: {} }, text: '', completedAt: T0 } } });
    expect((await api.personal(T0)).map((v) => v.task.id)).toEqual(['mara-1', 'mara-2']);
    await api.take('mara-2', T0);
    expect((await api.finish('mara-2', T0, () => 0.99)).ok).toBe(true);
    // Fifteen hexes walked since taking the finale.
    const cells = Array.from({ length: 15 }, (_, i) => ({ h3: `x${i}`, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] }));
    const walked = taskApi(() => store, async () => cells, async () => [], async () => 0);
    await walked.take('mara-3', T0 - 1);
    expect((await walked.finish('mara-3', T0)).ok).toBe(true);
    expect((await store.get<Investigator>(K.investigator))?.skills.fight).toBe(5);
    const me: PlayerProfile = { id: 'me', name: 'Mara', xp: 0 } as PlayerProfile;
    const entry = await retireKingdom(store, me, [], T0, () => 'k1');
    expect(entry.tale).toBe('The Dockworker · The Long Way Home');
  });
});

describe('the weakness', () => {
  it('comes over them when sanity runs below 3, once at a time', async () => {
    const low = { ...chooseArchetype(FIRST_INVESTIGATOR(T0), 'librarian'), sanity: 2, restedAt: T0 };
    const { store } = await realm(low);
    await settleConditions(store, { owned: [], home: null, temples: new Set() }, T0);
    const after = await store.get<Investigator>(K.investigator);
    expect(hasCondition(after as Investigator, 'amnesia', T0)).toBe(true);
    const sane = { ...chooseArchetype(FIRST_INVESTIGATOR(T0), 'librarian'), restedAt: T0 };
    const fine = await realm(sane);
    await settleConditions(fine.store, { owned: [], home: null, temples: new Set() }, T0);
    expect((await fine.store.get<Investigator>(K.investigator))?.conditions ?? []).toEqual([]);
  });
});
