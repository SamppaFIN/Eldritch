/**
 * Two Keep writes at once must both land (field e2e, keep-citizens:138, 2026-10-13).
 *
 * Every Keep write used to settle, then write back the whole Keep it had read — so a hand
 * sent to work while the Keep collected its tithe (you are standing on it) was put back
 * by the tithe's older copy, and the citizen went home again.
 */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { keepApi, titheAtKeep } from './citizenStore.js';
import { cellAt } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';
import type { ResourceState } from '../rules/terrain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const farm: Cell = { h3: cellAt({ lat: 61.4729, lng: 23.7258 }), ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [], buildings: [{ id: 'farm', builtAt: T0 }] };

describe('Keep writes that overlap', () => {
  it('a hand sent to work survives the tithe collected at the same moment', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => [farm]);
    await keep.found(T0);
    const [sent] = await Promise.all([keep.staff(farm.h3, 'farm', 1, T0 + 1_000), titheAtKeep(store, [farm], T0 + 1_000)]);
    expect(sent).toEqual({ ok: true });
    const staff = (await store.get<ResourceState>('resources'))?.keep?.staff ?? {};
    expect(Object.values(staff)).toEqual([1]);
  });

  it('two hands sent at once are two hands, not one', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => [farm]);
    await keep.found(T0);
    const outcomes = await Promise.all([keep.staff(farm.h3, 'farm', 1, T0), keep.staff(farm.h3, 'farm', 1, T0)]);
    // One citizen and one slot: exactly one of the two is taken, the other refused.
    expect(outcomes.filter((o) => o.ok)).toHaveLength(1);
    const staff = (await store.get<ResourceState>('resources'))?.keep?.staff ?? {};
    expect(Object.values(staff)).toEqual([1]);
  });
});
