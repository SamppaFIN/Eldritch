/**
 * BRDC-PERSIST-002 — the schema gate on KeyValueStore-backed state.
 *
 * `SAVE_VERSION` guards `localStorage`; this guards everything in IndexedDB. The failure
 * it exists to stop: a returning player's pre-shape-change data read back and trusted,
 * the way v2's level-118 save was.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { MIGRATIONS, SCHEMA_VERSION, versioned } from './schema.js';
import { MemoryStore } from './kv.js';
import type { KeyValueStore } from './kv.js';
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

describe('versioned() — migration path (BRDC-PERSIST-003)', () => {
  const mutable = MIGRATIONS as Record<number, (s: KeyValueStore) => Promise<void>>;
  // Restored, not emptied: there are real migrations registered now (BRDC-BUILD-007's
  // 2 → 3), and deleting them here would silently disarm them for every later test.
  const original = { ...mutable };

  afterEach(() => {
    for (const k of Object.keys(mutable)) delete mutable[Number(k)];
    Object.assign(mutable, original);
  });

  it('walks an old version forward when every step has a migration', async () => {
    const inner = new MemoryStore();
    await inner.set(KEY, SCHEMA_VERSION - 1);
    await inner.set('profile', { id: 'p1', xp: 40, stale: true });

    // A synthetic (SCHEMA_VERSION - 1) → SCHEMA_VERSION step: drop a field.
    mutable[SCHEMA_VERSION - 1] = async (s) => {
      const p = await s.get<{ id: string; xp: number }>('profile');
      if (p) await s.set('profile', { id: p.id, xp: p.xp });
    };

    const store = versioned(inner);
    expect(await store.schema()).toBe('migrated');
    expect(await store.get('profile')).toEqual({ id: 'p1', xp: 40 });
    expect(await inner.get(KEY)).toBe(SCHEMA_VERSION);
  });

  it('still resets when a step in the path has no migration', async () => {
    // 1 → 2 was BRDC-SCALE-001's cell-key rename, deliberately left without a transform,
    // so a store that old is still wiped however many later steps exist.
    const inner = new MemoryStore();
    await inner.set(KEY, 1);
    await inner.set('profile', { id: 'p1', xp: 40 });

    const store = versioned(inner);
    expect(await store.schema()).toBe('reset');
    expect(await store.get('profile')).toBeUndefined();
    expect(await inner.get(KEY)).toBe(SCHEMA_VERSION);
  });

  // Runs `MIGRATIONS[2]` directly rather than through `versioned().schema()` — that gate
  // now walks all the way to the live `SCHEMA_VERSION`, and 4 → 5 takes every Work down
  // regardless of what this step produced. Calling the step isolates what it alone does.
  it('2 → 3 rewrites a cell’s lone building into a one-element list (BRDC-BUILD-007)', async () => {
    const inner = new MemoryStore();
    await inner.set('cell:r6:8b112492eb03fff', {
      h3: '8b112492eb03fff',
      ownerId: 'me',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
      building: { id: 'monument', builtAt: T0 },
    });
    await inner.set('cell:r6:8b112492eb07fff', {
      h3: '8b112492eb07fff',
      ownerId: 'me',
      strength: 120,
      lastVisitedAt: T0,
      visitDays: [],
    });

    await MIGRATIONS[2]!(inner);

    const migrated = await inner.get<{ building?: unknown; buildings?: { id: string }[] }>(
      'cell:r6:8b112492eb03fff',
    );
    expect(migrated?.building).toBeUndefined();
    expect(migrated?.buildings).toEqual([{ id: 'monument', builtAt: T0 }]);

    const bare = await inner.get<{ buildings?: unknown }>('cell:r6:8b112492eb07fff');
    expect(bare?.buildings).toBeUndefined();
  });

  describe('3 → 4 puts a hex back down to one Work (PIVOT-2026-09-09 §6)', () => {
    const cell = (h3: string, buildings: { id: string; builtAt: number }[]) => ({
      h3,
      ownerId: 'me',
      strength: 300,
      lastVisitedAt: T0,
      visitDays: [],
      buildings,
    });

    /**
     * A schema-3 store with a crowded hex, a lone Work and bare ground. Runs `MIGRATIONS[3]`
     * directly rather than through `versioned().schema()` — that gate now walks all the way
     * to the live `SCHEMA_VERSION`, and 4 → 5 (below) takes every Work down regardless of
     * what step 3 chose to keep. Calling the step function isolates what step 3 alone does.
     */
    async function crowded(): Promise<KeyValueStore> {
      const inner = new MemoryStore();
      await inner.set(
        'cell:r6:8b112492eb03fff',
        cell('8b112492eb03fff', [
          { id: 'sawmill', builtAt: T0 },
          { id: 'lumbermill', builtAt: T0 + 1 },
          { id: 'monument', builtAt: T0 + 2 },
        ]),
      );
      await inner.set('cell:r6:8b112492eb07fff', cell('8b112492eb07fff', [
        { id: 'mine', builtAt: T0 },
      ]));
      await inner.set('cell:r6:8b112492eb0ffff', {
        h3: '8b112492eb0ffff',
        ownerId: 'me',
        strength: 120,
        lastVisitedAt: T0,
        visitDays: [],
      });
      return inner;
    }

    it('leaves the strongest standing and takes the rest down', async () => {
      const inner = await crowded();
      await MIGRATIONS[3]!(inner);

      const many = await inner.get<{ buildings: { id: string }[] }>('cell:r6:8b112492eb03fff');
      expect(many?.buildings.map((w) => w.id)).toEqual(['lumbermill']);
    });

    it('does not touch a hex that already held one, or bare ground', async () => {
      const inner = await crowded();
      await MIGRATIONS[3]!(inner);

      const one = await inner.get<{ buildings: { id: string }[] }>('cell:r6:8b112492eb07fff');
      expect(one?.buildings.map((w) => w.id)).toEqual(['mine']);
      const bare = await inner.get<{ buildings?: unknown }>('cell:r6:8b112492eb0ffff');
      expect(bare?.buildings).toBeUndefined();
    });

    // The whole point of the razed key: what it took is owed back, so it cannot vanish
    // silently. `razedStore.takeRazed` is what pays it.
    it('writes down every Work it razed, so it can be paid back', async () => {
      const inner = await crowded();
      await MIGRATIONS[3]!(inner);
      expect(await inner.get<string[]>('razed')).toEqual(['sawmill', 'monument']);
    });

    it('writes nothing down when it had nothing to take', async () => {
      const inner = new MemoryStore();
      await inner.set('cell:r6:8b112492eb07fff', cell('8b112492eb07fff', [
        { id: 'mine', builtAt: T0 },
      ]));

      await MIGRATIONS[3]!(inner);
      expect(await inner.get('razed')).toBeUndefined();
    });
  });

  describe('4 → 5 retires the whole pre-Worldseed building catalogue', () => {
    it('takes down the one Work a hex held, Fortress included, with its siege mark', async () => {
      const inner = new MemoryStore();
      await inner.set(KEY, 4);
      await inner.set('cell:r6:8b112492eb03fff', {
        h3: '8b112492eb03fff',
        ownerId: 'me',
        strength: 300,
        lastVisitedAt: T0,
        visitDays: [],
        buildings: [{ id: 'fortress', builtAt: T0 }],
        breachedOn: '2026-09-15',
      });

      const store = versioned(inner);
      expect(await store.schema()).toBe('migrated');

      const cell = await store.get<{ buildings?: unknown; breachedOn?: unknown; ownerId: string }>(
        'cell:r6:8b112492eb03fff',
      );
      expect(cell?.buildings).toBeUndefined();
      expect(cell?.breachedOn).toBeUndefined();
      // Everything else about the cell is untouched.
      expect(cell?.ownerId).toBe('me');
    });

    it('leaves bare ground and the Temple place alone', async () => {
      const inner = new MemoryStore();
      await inner.set(KEY, 4);
      await inner.set('cell:r6:8b112492eb07fff', {
        h3: '8b112492eb07fff',
        ownerId: 'me',
        strength: 120,
        lastVisitedAt: T0,
        visitDays: [],
      });
      // The Temple is a place (templeStore.ts), never a BuildingId — nothing here to touch.
      await inner.set('temple', { level: 2 });

      await versioned(inner).schema();

      const bare = await inner.get<{ buildings?: unknown }>('cell:r6:8b112492eb07fff');
      expect(bare?.buildings).toBeUndefined();
      expect(await inner.get('temple')).toEqual({ level: 2 });
    });

    it('writes every razed Work down so it is paid back, appending to a step-3 debt', async () => {
      const inner = new MemoryStore();
      await inner.set(KEY, 3);
      await inner.set('cell:r6:8b112492eb03fff', {
        h3: '8b112492eb03fff',
        ownerId: 'me',
        strength: 300,
        lastVisitedAt: T0,
        visitDays: [],
        buildings: [
          { id: 'sawmill', builtAt: T0 },
          { id: 'lumbermill', builtAt: T0 + 1 },
          { id: 'monument', builtAt: T0 + 2 },
        ],
      });

      // A store two versions behind composes both steps: 3 → 4 razes down to one Work
      // first, then 4 → 5 razes what is left standing — every one of the three ends up
      // in the same `razed` list however step 3 picked its survivor.
      expect(await versioned(inner).schema()).toBe('migrated');
      const razed = await inner.get<string[]>('razed');
      expect(new Set(razed)).toEqual(new Set(['sawmill', 'lumbermill', 'monument']));
      expect(razed).toHaveLength(3);
    });

    it('writes nothing down when there was nothing left to take', async () => {
      const inner = new MemoryStore();
      await inner.set(KEY, 4);
      await inner.set('cell:r6:8b112492eb07fff', {
        h3: '8b112492eb07fff',
        ownerId: 'me',
        strength: 120,
        lastVisitedAt: T0,
        visitDays: [],
      });

      expect(await versioned(inner).schema()).toBe('migrated');
      expect(await inner.get('razed')).toBeUndefined();
    });
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
