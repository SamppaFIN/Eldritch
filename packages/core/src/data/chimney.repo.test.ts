/** BRDC-CHIMNEY-001 — lighting the chimneys lifts the fog for good, once. */
import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { chimneyApi } from './chimneyStore.js';
import { CHIMNEYS, CHIMNEY_SIGHT_RINGS, chimneyCentre } from '../rules/chimney.js';
import type { Cell } from '../types/domain.js';

const NOW = Date.parse('2026-10-08T12:00:00Z');
const cell = (h3: string): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: NOW, visitDays: [] });

describe('chimneyApi', () => {
  it('two held: no sight; three: a kilometre seen, lit once', async () => {
    const store = new MemoryStore();
    let held = CHIMNEYS.slice(0, 2).map((c) => cell(c.h3));
    const api = chimneyApi(() => store, async () => held);
    const two = await api.view(NOW);
    expect(two.litAt).toBeNull();
    expect(two.sites.filter((s) => s.held)).toHaveLength(2);
    expect(await store.get(K.sighted)).toBeUndefined();

    held = CHIMNEYS.map((c) => cell(c.h3));
    expect((await api.view(NOW + 1)).litAt).toBe(NOW + 1);
    const sighted = (await store.get<Record<string, number>>(K.sighted)) ?? {};
    expect(sighted[chimneyCentre()]).toBe(NOW + 1);
    expect(Object.keys(sighted)).toHaveLength(3 * CHIMNEY_SIGHT_RINGS * (CHIMNEY_SIGHT_RINGS + 1) + 1);
    held = [];
    expect((await api.view(NOW + 2)).litAt).toBe(NOW + 1);
  });
});
