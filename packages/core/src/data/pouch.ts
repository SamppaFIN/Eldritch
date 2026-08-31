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
import { research } from '../rules/tech.js';
import type { ResearchResult, TechId } from '../rules/tech.js';
import { buildingBonus, buildingsOf, storageCap } from '../rules/build.js';
import type { CaptureOutcome, Cell, PlayerId } from '../types/domain.js';
import type { KeyValueStore } from './kv.js';

const KEY = 'resources';

/**
 * Read the stored pouch, or an empty one if there is nothing yet.
 *
 * No shape check here any more. A pool from before a shape change cannot reach this
 * point: `MockRepository` wraps its store in `versioned()` (BRDC-PERSIST-002), and an
 * unrecognised schema version clears the store on open. The structural sniff this
 * replaced — `{ water, wood, gold }` read back as the nine-field shape, `undefined + number`
 * minting `NaN` — is gone with it.
 */
async function read(store: KeyValueStore, now: number): Promise<ResourceState> {
  return (await store.get<ResourceState>(KEY)) ?? { pool: EMPTY_POOL, since: now };
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
  // Buildings feed in here, not inside settleResources: a Storehouse raises the ceiling,
  // and everything with a `produces` line adds a flat per-hour bonus, dormancy-filtered
  // (BRDC-BUILD-001). Keeping it here is what lets `rules/terrain.ts` stay building-blind.
  const held = buildingsOf(owned);
  const settled = settleResources(stored, owned, now, storageCap(held), buildingBonus(owned, now));
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

/**
 * Spend wisdom to research one technology (BRDC-TECH-001).
 *
 * The pouch's second verb, after warding. Settles first — the trickle owed up to now has
 * to be banked before it can be spent — and writes the pool back only on success. The
 * researched list itself belongs to the repository; this module only moves the wisdom.
 */
export async function researchWith(
  store: KeyValueStore,
  researched: readonly TechId[],
  id: TechId,
  owned: readonly Cell[],
  now: number,
): Promise<ResearchResult> {
  const state = await settlePouch(store, owned, now);
  const result = research(researched, id, state.pool);
  if (result.ok) await writePouch(store, result.pool, now);
  return result;
}
