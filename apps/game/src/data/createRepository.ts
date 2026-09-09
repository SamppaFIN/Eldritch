/**
 * The one place a repository is chosen.
 *
 * No component, hook or store may construct one, and none may import a storage client
 * directly. In Phase 3 this is where SupabaseRepository appears behind an environment
 * flag, with the mock staying on as the offline fallback — and nothing else changes.
 */
import { MemoryStore, MockRepository, enableTerrainSurvey } from '@es3/core';
import type { BuildingId, GameRepository } from '@es3/core';
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
  /**
   * Works the one-per-cell migration took down, already paid back into the pouch
   * (PIVOT-2026-09-09 §6). Empty on every open but the first one after the upgrade.
   */
  razed: BuildingId[];
}

export async function createRepository(): Promise<RepositoryHandle> {
  const durable = await idbAvailable();
  const store = durable ? new IdbStore() : new MemoryStore();

  const repository = new MockRepository({ store });
  const reset = (await repository.schemaOutcome()) === 'reset';
  // Right after the schema gate, before anything reads the pouch: the migration's debt is
  // settled here or the player never hears about it.
  const razed = await repository.takeRazed(Date.now());

  /*
   * No starter grant here any more (BRDC-ECON-007). The founding stash is handed out
   * once, inside `setHome`, when the Hearth is actually raised — and after that the pouch
   * fills only from claiming ground and holding it. `grantVersionGift` and its safety net
   * are gone: an empty pouch is now a real state, not one to paper over.
   */
  return { repository, durable, reset, razed };
}
