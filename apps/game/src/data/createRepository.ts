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

/** localStorage flag: set once, to the APP_VERSION that handed out the starter pouch.
 *  Its presence — not its value — is what says the gift has been given. */
const GIFT_KEY = 'granted-version';

/**
 * Is the starter pouch owed? (BRDC-ECON-005)
 *
 * Once per game — `granted` is the stamp, and only its absence counts. The old rule
 * compared it to `APP_VERSION`, which handed out a full floor of every resource on every
 * deploy. Plus the safety net: a player who has founded a Hearth and holds literally
 * nothing gets refilled, because that state is never intended.
 */
export function giftIsOwed(granted: string | null, started: boolean, pouchEmpty: boolean): boolean {
  return granted === null || (started && pouchEmpty);
}

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
   * A starter pouch (BRDC-ECON-003, BRDC-ECON-005). Test-phase generosity: the player
   * should be able to try buildings, mana and research without walking an hour to fund
   * the first one. `grantVersionGift` only ever raises to the floor.
   *
   * Given **once per game**, not once per version — it used to fire on every APP_VERSION
   * change, three times on 2026-09-05 alone. Production was working the whole time; the
   * gift kept burying it, and from the field that reads as "the numbers move on their own
   * and walking does nothing". `Delete progress` clears localStorage, so a fresh game
   * gets a fresh gift. The rule itself is `giftIsOwed`, where it can be tested.
   */
  const now = Date.now();
  const started = (await repository.getHome()) !== null;
  const empty = !Object.values(await repository.getResources(now)).some((v) => v > 0);
  if (giftIsOwed(load<string | null>(GIFT_KEY, null), started, empty)) {
    await grantVersionGift(store, await repository.getOwnedCells(now), now);
    saveNow(GIFT_KEY, APP_VERSION);
  }

  return { repository, durable, reset };
}
