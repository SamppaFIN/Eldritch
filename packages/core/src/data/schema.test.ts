/**
 * BRDC-PERSIST-002 — the schema gate on KeyValueStore-backed state.
 *
 * `SAVE_VERSION` guards `localStorage`; this guards everything in IndexedDB. The failure
 * it exists to stop: a returning player's pre-shape-change data read back and trusted,
 * the way v2's level-118 save was.
 */
import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, versioned } from './schema.js';
import { MemoryStore } from './kv.js';
import { MockRepository } from './MockRepository.js';

const KEY = 'schema:version';
const T0 = Date.parse('2026-08-31T12:00:00Z');

/** Counts how often the underlying store is cleared, to prove the gate runs once. */
class CountingStore extends MemoryStore {
  clears = 0;
  override async clear(): Promise<void> {
    this.clears += 1;
    return super.clear();
  }
}

describe('versioned()', () => {
  it('stamps a fresh store and reports ok — a first launch is not a stale save', async () => {
    const inner = new MemoryStore();
    const store = versioned(inner);

    expect(await store.schema()).toBe('ok');
    expect(await inner.get(KEY)).toBe(SCHEMA_VERSION);
  });

  it('leaves a store at the current version untouched', async () => {
    const inner = new MemoryStore();
    await inner.set(KEY, SCHEMA_VERSION);
    await inner.set('profile', { id: 'p1', xp: 40 });

    const store = versioned(inner);

    expect(await store.schema()).toBe('ok');
    expect(await store.get('profile')).toEqual({ id: 'p1', xp: 40 });
  });

  it('clears a store at a stale version and re-stamps it', async () => {
    const inner = new MemoryStore();
    await inner.set(KEY, SCHEMA_VERSION + 98);
    await inner.set('profile', { id: 'p1', xp: 40 });

    const store = versioned(inner);

    expect(await store.schema()).toBe('reset');
    expect(await store.get('profile')).toBeUndefined();
    expect(await inner.get(KEY)).toBe(SCHEMA_VERSION);
  });

  it('clears data sitting under no version key at all', async () => {
    const inner = new MemoryStore();
    // A real pre-BRDC-PERSIST-002 store: game data, no schema key.
    await inner.set('resources', { pool: { water: 30, wood: 5, gold: 2 }, since: T0 });
    await inner.set('cell:8a2a1072b59ffff', { h3: '8a2a1072b59ffff', ownerId: 'p1' });

    const store = versioned(inner);

    expect(await store.schema()).toBe('reset');
    expect(await store.get('resources')).toBeUndefined();
    expect(await store.get('cell:8a2a1072b59ffff')).toBeUndefined();
  });

  it('runs the check once, however the first calls are interleaved', async () => {
    const inner = new CountingStore();
    await inner.set('profile', { id: 'p1', xp: 40 });
    const store = versioned(inner);

    await Promise.all([
      store.get('profile'),
      store.set('a', 1),
      store.keys('cell:'),
      store.getMany(['a', 'b']),
      store.delete('c'),
    ]);

    expect(inner.clears).toBe(1);
  });

  it('re-stamps on a deliberate clear, so the next open is not seen as stale', async () => {
    const inner = new MemoryStore();
    await inner.set(KEY, SCHEMA_VERSION);
    await inner.set('profile', { id: 'p1', xp: 40 });

    const store = versioned(inner);
    await store.schema();
    await store.clear();

    expect(await versioned(inner).schema()).toBe('ok');
  });
});

describe('MockRepository through the schema gate', () => {
  it('wipes a store whose schema version is absent, and starts clean', async () => {
    const store = new MemoryStore();
    await store.set('cell:8a2a1072b59ffff', {
      h3: '8a2a1072b59ffff',
      ownerId: 'ghost',
      strength: 300,
    });
    const repo = new MockRepository({ store, seed: 11 });

    expect(await repo.schemaOutcome()).toBe('reset');
    expect(await repo.getOwnedCells(T0)).toEqual([]);
  });

  it('reports ok on a clean store', async () => {
    const repo = new MockRepository({ store: new MemoryStore(), seed: 11 });
    expect(await repo.schemaOutcome()).toBe('ok');
  });
});
