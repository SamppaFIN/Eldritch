/**
 * BRDC-DIPLO-001 — the village is placed, holds, and trades at its quay.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { CITY_STATES, EMPTY_POOL, TRADE_PARCEL, tradeReturn } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { cityAtDoor, cityCells, doorCell, placeCityStates } from './cityStateStore.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-11T12:00:00Z');
const CITY = CITY_STATES[0] as (typeof CITY_STATES)[number];

async function storeWith(pool: Partial<ResourcePool> = {}) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: T0, sinceDay: T0 });
  return store;
}

describe('placeCityStates', () => {
  let store: MemoryStore;
  beforeEach(async () => {
    store = await storeWith();
  });

  it('puts the village on the map, at full strength, owned by the city', async () => {
    expect(await placeCityStates(store, T0)).toBeGreaterThan(0);
    const cell = await store.get<Cell>(K.cell(doorCell(CITY)));
    expect(cell?.ownerId).toBe(CITY.owner);
    expect(cell?.strength).toBe(CITY.strength);
  });

  it('is idempotent — placing it again writes nothing', async () => {
    await placeCityStates(store, T0);
    expect(await placeCityStates(store, T0 + 86_400_000)).toBe(0);
  });

  /*
   * A city state is a neighbour, not a land grab. Ground a player already holds is never
   * overwritten by a village appearing — the same stance `mergeWorld` takes for world.json.
   */
  it('never takes ground somebody already holds', async () => {
    const taken = cityCells(CITY)[1] as string;
    const mine: Cell = { h3: taken, ownerId: 'me', strength: 120, lastVisitedAt: T0, visitDays: [] };
    await store.set(K.cell(taken), mine);

    await placeCityStates(store, T0);
    expect((await store.get<Cell>(K.cell(taken)))?.ownerId).toBe('me');
  });

  /*
   * Deliberately not `imported`: that flag also makes `getCells` return a cell whatever
   * the viewport, which would draw a Tampere village on the far side of the world.
   */
  it('does not mark its ground as imported', async () => {
    await placeCityStates(store, T0);
    expect((await store.get<Cell>(K.cell(doorCell(CITY))))?.imported).toBeUndefined();
  });
});

describe('cityAtDoor', () => {
  it('answers at the quay and nowhere else in the village', async () => {
    const store = await storeWith();
    await placeCityStates(store, T0);

    expect((await cityAtDoor(store, doorCell(CITY)))?.id).toBe(CITY.id);
    const notDoor = cityCells(CITY).find((h3) => h3 !== doorCell(CITY)) as string;
    expect(await cityAtDoor(store, notDoor)).toBeNull();
  });
});

describe('trading through the repository', () => {
  it('swaps a parcel, takes the loss, and writes it', async () => {
    const store = await storeWith({ wood: 100 });
    const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
    await placeCityStates(store, T0);

    const r = await repo.trade(doorCell(CITY), 'wood', 'food', T0);
    expect(r.ok).toBe(true);

    const pool = await repo.getResources(T0);
    expect(pool.wood).toBe(100 - TRADE_PARCEL);
    expect(pool.food).toBe(tradeReturn(TRADE_PARCEL));
  });

  it('refuses away from a quay, and takes nothing', async () => {
    const store = await storeWith({ wood: 100 });
    const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
    await placeCityStates(store, T0);

    const notDoor = cityCells(CITY).find((h3) => h3 !== doorCell(CITY)) as string;
    expect((await repo.trade(notDoor, 'wood', 'food', T0)).ok).toBe(false);
    expect((await repo.getResources(T0)).wood).toBe(100);
  });

  it('refuses a parcel the pouch cannot cover, and takes nothing', async () => {
    const store = await storeWith({ wood: 5 });
    const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
    await placeCityStates(store, T0);

    expect(await repo.trade(doorCell(CITY), 'wood', 'food', T0)).toEqual({
      ok: false,
      refused: 'cannot-afford',
    });
    expect((await repo.getResources(T0)).wood).toBe(5);
  });

  it('finds the quay through the repository too', async () => {
    const store = await storeWith();
    const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
    await placeCityStates(store, T0);
    expect((await repo.cityAt(doorCell(CITY)))?.name).toBe(CITY.name);
  });
});
