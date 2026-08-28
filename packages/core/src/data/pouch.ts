/**
 * The pouch: reading and paying resources.
 *
 * Split out of MockRepository when that file reached its four hundred lines. The rule
 * says split, not raise — and this is a coherent seam: everything here is about the
 * resource ledger and nothing else in the repository needs to know how it is stored.
 */
import { EMPTY_POOL, addClaimYield, settleResources } from '../rules/terrain.js';
import type { ResourcePool, ResourceState } from '../rules/terrain.js';
import { ward } from '../rules/ward.js';
import type { WardResult } from '../rules/ward.js';
import type { CaptureOutcome, Cell, H3Index, PlayerId } from '../types/domain.js';
import type { KeyValueStore } from './kv.js';

const KEY = 'resources';

async function read(store: KeyValueStore, now: number): Promise<ResourceState> {
  return (await store.get<ResourceState>(KEY)) ?? { pool: EMPTY_POOL, since: now };
}

/**
 * Bring the pouch up to date and persist it.
 *
 * Written back rather than re-derived: resources are earned and kept, so a projection
 * would have to be recomputed from the beginning of time on every read.
 */
export async function settlePouch(
  store: KeyValueStore,
  owned: readonly H3Index[],
  now: number,
): Promise<ResourceState> {
  const stored = await read(store, now);
  const settled = settleResources(stored, owned, now);
  if (settled !== stored) await store.set(KEY, settled);
  return settled;
}

/**
 * Pay the one-off yield for ground that just changed hands.
 *
 * Settles first, so the trickle owed up to this moment is banked before the claim is
 * added — otherwise the claim would be folded into a pool that is about to be recomputed
 * from an older timestamp, and paid for twice.
 */
export async function awardClaims(
  store: KeyValueStore,
  owned: readonly H3Index[],
  outcomes: readonly CaptureOutcome[],
  now: number,
): Promise<void> {
  const taken = outcomes.filter((o) => o.kind === 'claimed' || o.kind === 'taken');
  if (taken.length === 0) return;

  const state = await settlePouch(store, owned, now);

  let pool = state.pool;
  for (const outcome of taken) pool = addClaimYield(pool, outcome.h3);
  await store.set<ResourceState>(KEY, { ...state, pool });
}

/**
 * Write a pool back without touching the trickle clock.
 *
 * For spending. `since` belongs to the trickle and must survive a purchase — moving it
 * would hand the player a free hour, or steal one, depending on which way it went.
 */
export async function writePouch(
  store: KeyValueStore,
  pool: ResourcePool,
  now: number,
): Promise<void> {
  const state = await read(store, now);
  await store.set<ResourceState>(KEY, { ...state, pool });
}

/**
 * Spend the pouch to ward one cell.
 *
 * Settles first: the trickle owed up to this moment has to be in the pool before it is
 * spent, or a player is refused a ward they had already earned the timber for.
 *
 * Returns the new cell rather than writing it — the cell store belongs to the repository
 * and this module only owns the ledger.
 */
export async function wardWith(
  store: KeyValueStore,
  cell: Cell,
  me: PlayerId,
  owned: readonly H3Index[],
  now: number,
): Promise<WardResult> {
  const state = await settlePouch(store, owned, now);
  const result = ward(cell, state.pool, me);
  if (result.warded) await writePouch(store, result.pool, now);
  return result;
}
