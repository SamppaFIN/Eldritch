/**
 * BRDC-BUILD-004 — Trade Routes through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, TRADE_ROUTE_COST, TRADE_ROUTE_GOLD, cellAt, neighboursOf } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-09-01T12:00:00Z');
const HOUR = 3_600_000;

async function repoWith(pool: Partial<ResourcePool>) {
  const store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, ...pool }, since: T0, sinceDay: T0 });
  const repo = new MockRepository({ store, newId: () => 'me', seed: 3 });
  const home = await repo.setHome(ORIGIN, T0);
  const near = neighboursOf(home)[0] as string;
  await store.set(K.cell(near), { h3: near, ownerId: 'me', strength: 200, lastVisitedAt: T0, visitDays: [] });
  return { repo, store, home, near };
}

describe('trade routes through the repository', () => {
  let repo: MockRepository;
  let home: string;
  let near: string;

  const START = 200; // comfortably under BASE_STORAGE_CAP
  const GOLD_COST = TRADE_ROUTE_COST.gold as number;
  const STONE_COST = TRADE_ROUTE_COST.stone as number;

  beforeEach(async () => {
    ({ repo, home, near } = await repoWith({ stone: START, gold: START }));
  });

  it('binds two held cells and then pays gold every hour', async () => {
    expect(await repo.layTradeRoute(home, near, T0)).toMatchObject({ ok: true });
    expect((await repo.getResources(T0)).gold).toBe(START - GOLD_COST);
    expect(await repo.getTradeRoutes()).toHaveLength(1);

    expect((await repo.getResources(T0 + 5 * HOUR)).gold).toBe(START - GOLD_COST + 5 * TRADE_ROUTE_GOLD);
  });

  it('refuses a route to ground the player does not hold', async () => {
    const rival = cellAt({ lat: ORIGIN.lat + 0.02, lng: ORIGIN.lng });
    expect(await repo.layTradeRoute(home, rival, T0)).toEqual({ ok: false, refused: 'not-yours' });
  });

  it('tears a route down, refunds half, and lets it be relaid', async () => {
    await repo.layTradeRoute(home, near, T0);
    const afterLay = (await repo.getResources(T0)).stone;
    expect(afterLay).toBe(START - STONE_COST);

    const gone = await repo.removeTradeRoute(near, home, T0); // either order
    expect(gone).toMatchObject({ ok: true });
    expect((await repo.getResources(T0)).stone).toBe(afterLay + Math.floor(STONE_COST / 2));
    expect(await repo.getTradeRoutes()).toHaveLength(0);

    expect(await repo.layTradeRoute(home, near, T0)).toMatchObject({ ok: true });
  });

  it('refuses to remove a route that was never laid', async () => {
    expect(await repo.removeTradeRoute(home, near, T0)).toEqual({
      ok: false,
      refused: 'no-such-route',
    });
  });
});
