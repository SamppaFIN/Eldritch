/**
 * The one place a repository is chosen.
 *
 * No component, hook or store may construct one, and none may import a storage client
 * directly. In Phase 3 this is where SupabaseRepository appears behind an environment
 * flag, with the mock staying on as the offline fallback — and nothing else changes.
 */
import { MemoryStore, MockRepository, enableTerrainSurvey } from '@es3/core';
import type { GameRepository } from '@es3/core';
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

  const repository = new MockRepository({ store });
  const reset = (await repository.schemaOutcome()) === 'reset';

  /*
   * No starter grant here any more (BRDC-ECON-007). The founding stash is handed out
   * once, inside `setHome`, when the Hearth is actually raised — and after that the pouch
   * fills only from claiming ground and holding it. `grantVersionGift` and its safety net
   * are gone: an empty pouch is now a real state, not one to paper over.
   */
  return { repository, durable, reset };
}
