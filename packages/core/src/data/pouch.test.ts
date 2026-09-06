/**
 * BRDC-ECON-002 — a stored pouch that is missing fields or has gone NaN self-heals on read.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL, RESOURCE_KINDS } from '../rules/terrain.js';
import type { ResourceKind } from '../rules/terrain.js';
import { forecastRates, grantVersionGift, normalizePool, resetPouch, settlePouch } from './pouch.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { Cell } from '../types/domain.js';

describe('normalizePool', () => {
  it('fills the fields a pre-nine-resource pouch is missing', () => {
    expect(normalizePool({ food: 40, wood: 12, stone: 3, gold: 7 })).toEqual({
      ...EMPTY_POOL,
      food: 40,
      wood: 12,
      stone: 3,
      gold: 7,
    });
  });

  it('replaces a NaN or infinite field with zero and keeps the rest', () => {
    expect(normalizePool({ ...EMPTY_POOL, food: NaN, wood: 20, gold: Infinity })).toEqual({
      ...EMPTY_POOL,
      wood: 20,
    });
  });

  it('a null or undefined pool becomes empty', () => {
    expect(normalizePool(null)).toEqual(EMPTY_POOL);
    expect(normalizePool(undefined)).toEqual(EMPTY_POOL);
  });
});

describe('the repository heals an old pouch instead of reading it as empty', () => {
  const T0 = Date.parse('2026-09-02T12:00:00Z');
  let store: MemoryStore;
  let repo: MockRepository;

  beforeEach(async () => {
    store = new MemoryStore();
    await store.set(SCHEMA_KEY, SCHEMA_VERSION);
    repo = new MockRepository({ store, newId: () => 'me' });
  });

  it('a five-field pouch reads back whole, not NaN', async () => {
    await store.set('resources', {
      pool: { food: 55, wood: 9, stone: 0, iron: 0, gold: 4 },
      since: T0,
      sinceDay: T0,
    });
    const pool = await repo.getResources(T0);
    expect(pool.food).toBe(55);
    expect(pool.gold).toBe(4);
    expect(Number.isNaN(pool.wisdom)).toBe(false);
    expect(pool.wisdom).toBe(0);
  });

  it('debugGrant tops every resource up', async () => {
    await store.set('resources', { pool: { ...EMPTY_POOL }, since: T0, sinceDay: T0 });
    await repo.debugGrant(T0);
    const pool = await repo.getResources(T0);
    expect(pool.wood).toBe(200);
    expect(pool.mana).toBe(200);
  });
});

describe('grantVersionGift — a starter pouch on a version change (BRDC-ECON-003)', () => {
  const T0 = Date.parse('2026-09-02T12:00:00Z');
  let store: MemoryStore;
  let repo: MockRepository;

  beforeEach(async () => {
    store = new MemoryStore();
    await store.set(SCHEMA_KEY, SCHEMA_VERSION);
    repo = new MockRepository({ store, newId: () => 'me' });
  });

  it('tops an empty pouch to the floor: 100 material, 30 mana and wisdom', async () => {
    await grantVersionGift(store, [], T0);
    const pool = await repo.getResources(T0);
    expect(pool.wood).toBe(100);
    expect(pool.gold).toBe(100);
    expect(pool.culture).toBe(100);
    expect(pool.tokens).toBe(100);
    expect(pool.mana).toBe(30);
    expect(pool.wisdom).toBe(30);
  });

  it('never reduces a resource that is already above the floor', async () => {
    await store.set('resources', {
      pool: { ...EMPTY_POOL, stone: 400, mana: 50 },
      since: T0,
      sinceDay: T0,
    });
    await grantVersionGift(store, [], T0);
    const pool = await repo.getResources(T0);
    expect(pool.stone).toBe(400); // untouched, already past 100
    expect(pool.mana).toBe(50); // untouched, already past 30
    expect(pool.iron).toBe(100); // was 0, lifted to the floor
  });
});

/**
 * BRDC-ECON-005 — the audit that was missing.
 *
 * `forecastRates` documents itself as a settle run forward, and therefore unable to
 * disagree with one. Nothing checked the claim, so a player had no way to tell a slow
 * trickle from a broken one. March, deliberately: the dark-time factor is a step function
 * around the December solstice and a boundary inside the window would be a false failure.
 */
describe('the pouch grows exactly what the forecast promised', () => {
  const T0 = Date.parse('2026-03-02T12:00:00Z');
  const HOUR = 3_600_000;
  const DAY = 86_400_000;
  /** A fishery: production per hour *and* a token per day, so both paths are audited. */
  const owned: Cell[] = [
    {
      h3: '8b112492eb03fff',
      ownerId: 'me',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
      buildings: [{ id: 'fishery', builtAt: T0 }],
    },
  ];

  it('an hour of settling adds the forecast per-hour, resource by resource', async () => {
    const store = new MemoryStore();
    const forecast = await forecastRates(store, owned, T0);
    const start = await settlePouch(store, owned, T0);
    const after = await settlePouch(store, owned, T0 + HOUR);
    for (const k of RESOURCE_KINDS as readonly ResourceKind[]) {
      expect(after.pool[k] - start.pool[k], k).toBe(forecast.perHour[k] ?? 0);
    }
  });

  it('a day of settling adds the forecast per-day, resource by resource', async () => {
    const store = new MemoryStore();
    const forecast = await forecastRates(store, owned, T0);
    const start = await settlePouch(store, owned, T0);
    const after = await settlePouch(store, owned, T0 + DAY);
    for (const k of RESOURCE_KINDS as readonly ResourceKind[]) {
      expect(after.pool[k] - start.pool[k], k).toBe(forecast.perDay[k] ?? 0);
    }
  });
});

describe('a no-op settle does not write (BRDC-ECON-006)', () => {
  const T0 = Date.parse('2026-03-02T12:00:00Z');

  /** Counts writes to the pouch key, to prove a settle that changes nothing stays silent. */
  class SpyStore extends MemoryStore {
    pouchWrites = 0;
    override async set<T>(key: string, value: T): Promise<void> {
      if (key === 'resources') this.pouchWrites += 1;
      return super.set(key, value);
    }
  }

  it('leaves a stored pouch untouched, so a concurrent spend is not clobbered', async () => {
    const store = new SpyStore();
    await store.set('resources', {
      pool: { ...EMPTY_POOL, stone: 100 },
      since: T0,
      sinceDay: T0,
    });
    store.pouchWrites = 0;

    // Same instant, no owned ground: settleResources returns its input by reference.
    await settlePouch(store, [], T0);
    expect(store.pouchWrites).toBe(0);

    // The regression: an unconditional write here would put stone back to 100 over a
    // spend that had just debited it between this call's read and its write.
    const stored = await store.get<{ pool: { stone: number } }>('resources');
    expect(stored?.pool.stone).toBe(100);
  });

  it('still starts the clock on a pouch that was never written', async () => {
    const store = new SpyStore();
    // No `resources` key. `read` must persist its stand-in so the trickle can accrue.
    const first = await settlePouch(store, [], T0);
    expect(first.since).toBe(T0);
    expect(await store.get('resources')).toBeDefined();
  });
});

describe('resetPouch (BRDC-ECON-005)', () => {
  const T0 = Date.parse('2026-03-02T12:00:00Z');

  it('empties every resource and restarts both clocks', async () => {
    const store = new MemoryStore();
    await store.set('resources', {
      pool: { ...EMPTY_POOL, wood: 400, mana: 90 },
      since: T0 - 86_400_000,
      sinceDay: T0 - 86_400_000,
    });

    expect(await resetPouch(store, T0)).toEqual(EMPTY_POOL);
    // A day of trickle was owed and is gone with the rest — the clocks moved to now, so
    // the very next read does not pay back what the reset just threw away.
    const after = await settlePouch(store, [], T0);
    for (const k of RESOURCE_KINDS as readonly ResourceKind[]) expect(after.pool[k], k).toBe(0);
  });
});
