/**
 * BRDC-BUILD-001 — building and demolishing through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { BASE_STORAGE_CAP, EMPTY_POOL } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');
const BOX = { west: ORIGIN.lng - 0.02, east: ORIGIN.lng + 0.02, south: ORIGIN.lat - 0.02, north: ORIGIN.lat + 0.02 };

async function repoWith(pool: Partial<ResourcePool>, researched: string[] = ['early-farming', 'masonry']) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: T0 });
  await store.set('researched', researched);
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  return { repo, store };
}

describe('build / demolish', () => {
  let repo: MockRepository;
  let home: string;

  beforeEach(async () => {
    ({ repo } = await repoWith({ wood: 999, stone: 999, gold: 999, culture: 999 }));
    home = await repo.setHome(ORIGIN, T0);
  });

  it('puts a building on an owned cell, and getCells carries it', async () => {
    const out = await repo.build(home, 'monument', T0);
    expect(out.ok).toBe(true);

    const here = (await repo.getCells(BOX, T0)).find((c) => c.h3 === home);
    expect(here?.building?.id).toBe('monument');
  });

  it('refuses a second building on the same cell', async () => {
    await repo.build(home, 'monument', T0);
    expect(await repo.build(home, 'market', T0)).toEqual({ ok: false, refused: 'occupied' });
  });

  it('refuses ground the player does not own', async () => {
    const rival = (await repo.getCells(BOX, T0)).find((c) => c.ownerId?.startsWith('seed-'));
    expect(await repo.build(rival!.h3, 'monument', T0)).toEqual({ ok: false, refused: 'not-yours' });
  });

  it('refuses the wrong terrain by name', async () => {
    await repo.setCellTerrain(home, { kind: 'mountain', source: 'tiles' });
    expect(await repo.build(home, 'granary', T0)).toEqual({ ok: false, refused: 'wrong-terrain' });
  });

  it('refuses a building whose tech is not researched', async () => {
    const { repo: poor } = await repoWith({ wood: 999, stone: 999 }, []);
    const h = await poor.setHome(ORIGIN, T0);
    expect(await poor.build(h, 'storehouse', T0)).toEqual({ ok: false, refused: 'locked' });
  });

  it('refuses when the pouch cannot pay, and leaves it untouched', async () => {
    const { repo: broke } = await repoWith({ wood: 5 });
    const h = await broke.setHome(ORIGIN, T0);
    expect(await broke.build(h, 'monument', T0)).toEqual({ ok: false, refused: 'cannot-afford' });
    expect((await broke.getResources(T0)).wood).toBe(5);
  });

  it('charges the pouch on a successful build', async () => {
    const before = (await repo.getResources(T0)).stone;
    await repo.build(home, 'monument', T0);
    expect((await repo.getResources(T0)).stone).toBe(before - 60);
  });

  it('demolishing removes the building and refunds half', async () => {
    await repo.build(home, 'monument', T0);
    const afterBuild = (await repo.getResources(T0)).stone;

    const out = await repo.demolish(home, T0);
    expect(out.ok).toBe(true);
    expect((await repo.getCells(BOX, T0)).find((c) => c.h3 === home)?.building).toBeUndefined();
    expect((await repo.getResources(T0)).stone).toBe(afterBuild + 30);
  });

  it('demolishing bare ground is refused', async () => {
    expect(await repo.demolish(home, T0)).toEqual({ ok: false, refused: 'nothing-here' });
  });

  it('a built Storehouse raises the pouch ceiling it settles against', async () => {
    // The cap wiring: settlePouch reads storageCap(buildingsOf(owned)). Start the pouch
    // at the base cap, then a Storehouse must let a settle climb above it.
    const { repo: full, store } = await repoWith({ wood: 999, stone: 999 });
    const h = await full.setHome(ORIGIN, T0);
    await full.setCellTerrain(h, { kind: 'forest', source: 'tiles' });
    await full.build(h, 'storehouse', T0);
    await store.set('resources', { pool: { ...EMPTY_POOL, wood: BASE_STORAGE_CAP }, since: T0 });

    // One awake forest hour: without the Storehouse this would be pinned at BASE_STORAGE_CAP.
    expect((await full.getResources(T0 + 3_600_000)).wood).toBeGreaterThan(BASE_STORAGE_CAP);
  });
});
