/**
 * The one place a repository is chosen.
 *
 * No component, hook or store may construct one, and none may import a storage client
 * directly. In Phase 3 this is where SupabaseRepository appears behind an environment
 * flag, with the mock staying on as the offline fallback — and nothing else changes.
 */
import {
  APP_VERSION,
  MemoryStore,
  MockRepository,
  enableTerrainSurvey,
  grantVersionGift,
  load,
  saveNow,
} from '@es3/core';
import type { GameRepository } from '@es3/core';
import { IdbStore, idbAvailable } from './IdbStore.js';

// The hand survey of the field-test area is client content, not a rule — on for the
// running game, off in the core test suite (BRDC-TERRAIN-003).
enableTerrainSurvey();

/** localStorage flag: the APP_VERSION whose starter pouch has already been granted. */
const GIFT_KEY = 'granted-version';

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
   * A starter pouch (BRDC-ECON-003). Test-phase generosity: the player should be able to
   * try buildings, mana and research without walking an hour to fund the first one.
   *
   * Granted when the version changed — or, as a safety net, whenever a player who has
   * already founded a Hearth is sitting on a completely empty pouch. Field reports kept
   * coming in with "no resources from anywhere"; the version flag alone was too fragile
   * (a `Delete progress`, a half-applied deploy). An empty pouch on a live game is never
   * intended, so refill it. `grantVersionGift` only ever raises to the floor.
   */
  const now = Date.now();
  const stale = load<string | null>(GIFT_KEY, null) !== APP_VERSION;
  const started = (await repository.getHome()) !== null;
  const empty = started && !Object.values(await repository.getResources(now)).some((v) => v > 0);
  if (stale || empty) {
    await grantVersionGift(store, await repository.getOwnedCells(now), now);
    saveNow(GIFT_KEY, APP_VERSION);
  }

  return { repository, durable, reset };
}
