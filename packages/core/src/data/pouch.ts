/**
 * The pouch: reading and paying resources.
 *
 * Split out of MockRepository when that file reached its four hundred lines. The rule
 * says split, not raise — and this is a coherent seam: everything here is about the
 * resource ledger and nothing else in the repository needs to know how it is stored.
 */
import { EMPTY_POOL, RESOURCE_KINDS, addClaimYield, settleResources } from '../rules/terrain.js';
import type { ResourcePool, ResourceState } from '../rules/terrain.js';
import { ward } from '../rules/ward.js';
import type { WardResult } from '../rules/ward.js';
import type { CaptureOutcome, Cell, PlayerId } from '../types/domain.js';
import type { KeyValueStore } from './kv.js';

const KEY = 'resources';

/**
 * Does this look like a pool in the current shape?
 *
 * `SAVE_VERSION` (`persist/save.ts`) only guards `localStorage` — the pouch lives in
 * IndexedDB through `KeyValueStore`, which has no schema version of its own at all
 * (see `docs/tickets/BRDC-PERSIST-002.md`, opened alongside this fix). Without this
 * check, a returning player's pre-BRDC-ECON-001 pool — `{ water, wood, gold }` — would
 * be read back, trusted as the new nine-field shape, and every missing field would read
 * as `undefined`. `canAfford`/`spend`/`settleResources` would then compute with
 * `undefined + number`, and the pouch would silently start filling with `NaN`.
 *
 * Treated as a reset, not a migration: `water`'s few dozen units are not worth carrying
 * across a shape change, and a wrong guess at how to fold it into `food` would be worse
 * than the honest, visible "the pouch starts over" this produces instead.
 */
function isCurrentShape(pool: unknown): pool is ResourcePool {
  if (typeof pool !== 'object' || pool === null) return false;
  const p = pool as Record<string, unknown>;
  return RESOURCE_KINDS.every((k) => typeof p[k] === 'number');
}

async function read(store: KeyValueStore, now: number): Promise<ResourceState> {
  const stored = await store.get<ResourceState>(KEY);
  if (stored && isCurrentShape(stored.pool)) return stored;
  return { pool: EMPTY_POOL, since: now };
}

/**
 * Bring the pouch up to date and persist it.
 *
 * Written back rather than re-derived: resources are earned and kept, so a projection
 * would have to be recomputed from the beginning of time on every read.
 *
 * Takes whole cells, not just their indices, because settling now checks each one's
 * `lastVisitedAt` for dormancy (BRDC-ECON-001) — an index alone cannot answer that.
 */
export async function settlePouch(
  store: KeyValueStore,
  owned: readonly Cell[],
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
  owned: readonly Cell[],
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
  owned: readonly Cell[],
  now: number,
): Promise<WardResult> {
  const state = await settlePouch(store, owned, now);
  const result = ward(cell, state.pool, me);
  if (result.warded) await writePouch(store, result.pool, now);
  return result;
}
