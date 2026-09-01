/**
 * The one place a repository is chosen.
 *
 * No component, hook or store may construct one, and none may import a storage client
 * directly. In Phase 3 this is where SupabaseRepository appears behind an environment
 * flag, with the mock staying on as the offline fallback — and nothing else changes.
 */
import {
  EMPTY_POOL,
  MemoryStore,
  MockRepository,
  SCHEMA_KEY,
  SCHEMA_VERSION,
  enableTerrainSurvey,
} from '@es3/core';
import type { GameRepository, KeyValueStore } from '@es3/core';
import { IdbStore, idbAvailable } from './IdbStore.js';

// The hand survey of the field-test area is client content, not a rule — on for the
// running game, off in the core test suite (BRDC-TERRAIN-003).
enableTerrainSurvey();

export interface RepositoryHandle {
  repository: GameRepository;
  /** False when storage is unavailable — the session will not survive a reload. */
  durable: boolean;
  /** True when the store was wiped on open because its schema version was stale. */
  reset: boolean;
}

export async function createRepository(): Promise<RepositoryHandle> {
  const durable = await idbAvailable();
  const store = durable ? new IdbStore() : new MemoryStore();
  if (import.meta.env.DEV) await devGrant(store);

  const repository = new MockRepository({ store });
  const reset = (await repository.schemaOutcome()) === 'reset';
  return { repository, durable, reset };
}

/**
 * Dev only: a starting pouch, so buildings and warding can be exercised before a walk has
 * filled one. Runs once, on a genuinely empty store — it never overwrites a real session.
 */
async function devGrant(store: KeyValueStore): Promise<void> {
  if (await store.get('resources')) return; // `resources` is pouch.ts's key
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', {
    pool: { ...EMPTY_POOL, wood: 400, stone: 400, food: 300, gold: 300, iron: 200, culture: 200 },
    since: Date.now(),
  });
}
