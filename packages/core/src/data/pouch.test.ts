/**
 * BRDC-ECON-002 — a stored pouch that is missing fields or has gone NaN self-heals on read.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { gridDisk, latLngToCell } from 'h3-js';
import { CLAIM_YIELD, EMPTY_POOL, RESOURCE_KINDS, resourceOf } from '../rules/terrain.js';
import type { ResourceKind, ResourcePool } from '../rules/terrain.js';
import {
  awardClaims,
  collectPouch,
  forecastRates,
  normalizePool,
  resetPouch,
  settlePouch,
  writePouch,
} from './pouch.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { Cell, CaptureOutcome } from '../types/domain.js';

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

  it('a spend and a settle fired together do not clobber — pouch writes serialise', async () => {
    /**
     * Production is off and an hour has passed, so `settlePouch` moves the clock without
     * touching the pool. Fired concurrently with a build's `writePouch`, the nudge used to
     * write a stale pool back over the debit (BRDC-ECON-006's other half). Every pouch
     * write now goes through one lock, re-reading inside it, so either order is safe.
     */
    const store = new MemoryStore();
    const HOUR = 3_600_000;
    await store.set('resources', {
      pool: { ...EMPTY_POOL, stone: 60 },
      since: T0 - HOUR,
      sinceDay: T0 - HOUR,
    });

    const spend = writePouch(store, { ...EMPTY_POOL }, T0); // the build, debiting to zero
    const settle = settlePouch(store, [], T0); // a poll, nudging the clock
    await Promise.all([spend, settle]);

    const stored = await store.get<{ pool: { stone: number }; since: number }>('resources');
    expect(stored?.pool.stone).toBe(0); // the spend survived
    expect(stored?.since).toBe(T0); // ...and the clock still advanced
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

/**
 * BRDC-ECON-007 — no subsidies. What the player gets, they get from playing: a yield
 * every time ground is taken, and an hourly trickle a Collect press acknowledges.
 */
describe('awardClaims — every new cell pays, in a batch, and again next time', () => {
  const T0 = Date.parse('2026-03-02T12:00:00Z');
  const HOUR = 3_600_000;
  const ring = gridDisk(latLngToCell(61.4729, 23.7258, 11), 3);
  const producing = ring.filter((h3) => resourceOf(h3) !== null);
  const barren = ring.filter((h3) => resourceOf(h3) === null);
  const total = (p: ResourcePool) => RESOURCE_KINDS.reduce((s, k) => s + p[k], 0);
  const claimed = (h3: string): CaptureOutcome => ({
    h3,
    kind: 'claimed',
    strengthBefore: 0,
    strengthAfter: 100,
    previousOwner: null,
  });

  it('pays CLAIM_YIELD once per producing cell taken in one batch', async () => {
    expect(producing.length).toBeGreaterThanOrEqual(2);
    const store = new MemoryStore();
    const take = producing.slice(0, 3);
    await awardClaims(store, [], take.map(claimed), T0);
    expect(total((await settlePouch(store, [], T0)).pool)).toBe(take.length * CLAIM_YIELD);
  });

  it('a barren cell yields nothing', async () => {
    expect(barren.length).toBeGreaterThanOrEqual(1);
    const store = new MemoryStore();
    await awardClaims(store, [], [claimed(barren[0] as string)], T0);
    expect(total((await settlePouch(store, [], T0)).pool)).toBe(0);
  });

  it('the same cell pays again when it is taken a second time', async () => {
    const store = new MemoryStore();
    const h3 = producing[0] as string;
    await awardClaims(store, [], [claimed(h3)], T0);
    await awardClaims(store, [], [{ ...claimed(h3), kind: 'taken', previousOwner: 'rival' }], T0 + HOUR);
    expect(total((await settlePouch(store, [], T0 + HOUR)).pool)).toBe(2 * CLAIM_YIELD);
  });

  it('reinforced and unchanged outcomes pay nothing', async () => {
    const store = new MemoryStore();
    const outs: CaptureOutcome[] = producing.slice(0, 2).map((h3) => ({
      h3,
      kind: 'reinforced',
      strengthBefore: 100,
      strengthAfter: 125,
      previousOwner: 'me',
    }));
    await awardClaims(store, [], outs, T0);
    expect(total((await settlePouch(store, [], T0)).pool)).toBe(0);
  });
});

describe('the founding stash (BRDC-ECON-007)', () => {
  const T0 = Date.parse('2026-03-02T12:00:00Z');
  const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

  const fresh = async () => {
    const store = new MemoryStore();
    await store.set(SCHEMA_KEY, SCHEMA_VERSION);
    return { store, repo: new MockRepository({ store, newId: () => 'me' }) };
  };

  it('a fresh Hearth grants exactly one Monument: 60 stone, 10 culture', async () => {
    const { repo } = await fresh();
    await repo.setHome(ORIGIN, T0);
    const pool = await repo.getResources(T0);
    expect(pool.stone).toBe(60);
    expect(pool.culture).toBe(10);
    expect(RESOURCE_KINDS.filter((k) => pool[k] > 0)).toEqual(['stone', 'culture']);
  });

  it('is given once — a second setHome does not stack it', async () => {
    const { repo } = await fresh();
    await repo.setHome(ORIGIN, T0);
    await repo.setHome(ORIGIN, T0);
    expect((await repo.getResources(T0)).stone).toBe(60);
  });

  it('never lands on top of resources already in the pouch', async () => {
    const { store, repo } = await fresh();
    await store.set('resources', { pool: { ...EMPTY_POOL, stone: 5 }, since: T0, sinceDay: T0 });
    await repo.setHome(ORIGIN, T0);
    expect((await repo.getResources(T0)).stone).toBe(5);
  });
});

describe('collectPouch — acknowledges the trickle, does not pay it', () => {
  const T0 = Date.parse('2026-03-02T12:00:00Z');
  const HOUR = 3_600_000;
  const fishery: Cell[] = [
    {
      h3: '8b112492eb03fff',
      ownerId: 'me',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
      buildings: [{ id: 'fishery', builtAt: T0 }],
    },
  ];

  it('the first press shows nothing and starts the clock', async () => {
    const store = new MemoryStore();
    expect(await collectPouch(store, fishery, T0)).toEqual({ delta: {}, total: 0, hours: 0, at: T0 });
    const stored = await store.get<{ collectedAt: number }>('resources');
    expect(stored?.collectedAt).toBe(T0);
  });

  it('a later press reports what came in since, and how long that was — without moving the pool', async () => {
    const store = new MemoryStore();
    await collectPouch(store, fishery, T0);
    const before = (await settlePouch(store, fishery, T0 + 3 * HOUR)).pool;
    const got = await collectPouch(store, fishery, T0 + 3 * HOUR);
    const after = (await settlePouch(store, fishery, T0 + 3 * HOUR)).pool;

    expect(got.hours).toBe(3);
    expect(got.total).toBeGreaterThan(0);
    for (const k of RESOURCE_KINDS as readonly ResourceKind[]) {
      expect(after[k], `${k} unmoved`).toBe(before[k]);
      expect(got.delta[k] ?? 0, `${k} measured`).toBe(before[k]);
    }
  });

  it('spending between presses never shows as a negative collect', async () => {
    const store = new MemoryStore();
    await collectPouch(store, fishery, T0);
    const state = await settlePouch(store, fishery, T0 + HOUR);
    await store.set('resources', { ...state, pool: { ...EMPTY_POOL } });
    const got = await collectPouch(store, fishery, T0 + HOUR);
    expect(got.total).toBe(0);
    for (const k of RESOURCE_KINDS as readonly ResourceKind[]) expect(got.delta[k] ?? 0).toBe(0);
  });
});
