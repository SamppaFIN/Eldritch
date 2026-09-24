/**
 * BRDC-WORKS-002 — a building's research tree, through the real `MockRepository`.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_POOL, MAX_STRENGTH, cellAt } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import { forgetTree, readTrees } from './worksTrees.js';
import type { Cell } from '../types/domain.js';
import type { ResourcePool } from '../rules/terrain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-24T12:00:00Z');

async function keepWith(pool: Partial<ResourcePool>) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  await repo.setHome(ORIGIN, T0);
  await store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: T0, sinceDay: T0 });
  return { repo, store, home: cellAt(ORIGIN) };
}

describe('works through the repository', () => {
  it('the Hearth is the Keep, and starts with nothing learned', async () => {
    const { repo, home } = await keepWith({});
    expect(await repo.works.viewAt(home, T0)).toEqual({ kind: 'keep', learned: [], level: 0 });
  });

  it('bare ground is not a page', async () => {
    const { repo, store, home } = await keepWith({});
    const bare = (await repo.getOwnedCells(T0)).find((c) => c.h3 !== home)!;
    await store.set(K.cell(bare.h3), { ...bare, buildings: undefined });
    expect(await repo.works.viewAt(bare.h3, T0)).toBeNull();
  });

  it('research pays from the pouch, records the node, and adds strength once', async () => {
    const { repo, store, home } = await keepWith({ stone: 50 });
    const weak = (await store.get<Cell>(K.cell(home)))!;
    await store.set(K.cell(home), { ...weak, strength: 100 });

    const r = await repo.works.research(home, 'keep.warded-walls', T0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.view).toEqual({ kind: 'keep', learned: ['keep.warded-walls'], level: 1 });
    expect((await repo.getResources(T0)).stone).toBe(10);
    expect((await store.get<Cell>(K.cell(home)))!.strength).toBe(Math.min(MAX_STRENGTH, 150));
  });

  it('a refusal writes nothing', async () => {
    const { repo, store, home } = await keepWith({ stone: 10 });
    expect(await repo.works.research(home, 'keep.warded-walls', T0)).toEqual({ ok: false, refused: 'short' });
    expect(await readTrees(store)).toEqual({});
    expect((await repo.getResources(T0)).stone).toBe(10);
  });

  it('what is learned pays in the forecast', async () => {
    const { repo, home } = await keepWith({ stone: 500, gold: 500, culture: 500 });
    const before = (await repo.getForecast(T0)).perHour.wisdom ?? 0;
    expect((await repo.works.research(home, 'keep.warded-walls', T0)).ok).toBe(true);
    expect((await repo.works.research(home, 'keep.council', T0)).ok).toBe(true);
    const after = (await repo.getForecast(T0)).perHour.wisdom ?? 0;
    expect(after - before).toBe(2);
  });

  it('a building that comes down forgets its tree', async () => {
    const { store, home } = await keepWith({});
    await store.set(K.worksTree, { [home]: ['keep.warded-walls'] });
    await forgetTree(store, home);
    expect(await readTrees(store)).toEqual({});
  });
});
