/**
 * BRDC-ECON-002 — a stored pouch that is missing fields or has gone NaN self-heals on read.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_POOL } from '../rules/terrain.js';
import { normalizePool } from './pouch.js';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';

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
