/**
 * What the ground under a cell is made of.
 *
 * Owning territory has meant a number going up. This is what makes one cell worth more
 * than another: a lake gives food, woodland gives timber, a parade of shops gives gold.
 * You cannot choose where those are — they are where you live — so the map decides what
 * a walk is worth, which is the whole point of a game played outdoors.
 *
 * **The data source here is a placeholder and that is said out loud.** Terrain is a
 * deterministic hash of the H3 index, clustered so it forms woods and lakes rather than
 * per-cell noise. It is not real terrain; it is the shape real terrain will fill. The
 * interface — `terrainOf(h3)` — is what stays when the vector tiles already on the
 * device are read instead (PIVOT-2026-08-27 §3.1, BRDC-TERRAIN-002).
 */
import { cellToParent } from 'h3-js';
import { DECAY_GRACE_HOURS } from './constants.js';
import type { Cell, H3Index } from '../types/domain.js';

export type TerrainKind = 'water' | 'forest' | 'market' | 'plain';

/**
 * Every resource the game knows about, in one place.
 *
 * Nine, not the ten Infinite's 2026-08-31 plan claims in its own heading — counted
 * from that plan's own building tables (wood, stone, iron, food, gold, wisdom, mana,
 * culture, tokens). The mismatch is the plan's, not a field missing here.
 *
 * `ResourcePool` and every function below are derived from this array rather than
 * hand-listing fields, so a tenth resource, if one turns out to be real, is one line
 * here instead of ten scattered edits (BRDC-ECON-001's own RED).
 */
export const RESOURCE_KINDS = [
  'wood',
  'stone',
  'iron',
  'food',
  'gold',
  'wisdom',
  'mana',
  'culture',
  'tokens',
] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export type ResourcePool = Record<ResourceKind, number>;

export const EMPTY_POOL: ResourcePool = Object.fromEntries(
  RESOURCE_KINDS.map((k) => [k, 0]),
) as ResourcePool;

/**
 * What each terrain gives. Plain gives nothing, and most ground is plain.
 *
 * Only three terrains produce anything, because only three terrains exist — forest,
 * market and water are all `terrainOf` can return until `BRDC-TERRAIN-002` adds
 * mountains, hills and the rest. The other six resources sit in the pool with nothing
 * feeding them yet, which is honest: a field nothing can earn is not the same problem
 * as a field that does not exist, and buildings that cost it can still be designed.
 *
 * Water gives `food`, not a `water` resource — the plan's own model (a fishing pier on
 * a lake gives fish) — so the pool never carries a resource nobody can ever spend.
 */
export const RESOURCE_OF: Readonly<Record<TerrainKind, ResourceKind | null>> = {
  water: 'food',
  forest: 'wood',
  market: 'gold',
  plain: null,
};

/** Paid once, the moment a producing cell changes hands. Never capped — see spend below. */
export const CLAIM_YIELD = 10;
/** Paid for holding a producing cell, per hour, while it is awake. */
export const TRICKLE_PER_HOUR = 2;

/**
 * How much of any one resource the pouch can hold before production stops.
 *
 * Flat for every resource, not per-building: nothing raises it yet. The plan's own
 * Storage building will, in `BRDC-BUILD-001` — at which point this becomes a value fed
 * by how many a player has built, not a constant. Sized so a handful of producing
 * cells fill it in roughly a week, matching the tempo this ticket locks in: a weekend
 * away costs nothing, a week away stops the economy, and walking restarts it.
 */
export const BASE_STORAGE_CAP = 500;

/** Milliseconds of no visit before a cell stops producing. Same clock as decay. */
const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

/**
 * The resolution terrain clusters at.
 *
 * Res 9 holds forty-nine ownership cells — about a tenth of a square kilometre, which is
 * a park or a small lake. Clustering at the ownership resolution itself would give a
 * dither of unrelated cells; clustering any coarser would make a whole neighbourhood one
 * material.
 */
const CLUSTER_RES = 9;

/** FNV-1a over the index. Cheap, stable, and spread evenly enough to threshold on. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * The terrain of one cell.
 *
 * Two rolls, not one. The first picks what the surrounding region is made of; the second
 * asks whether this particular cell is really that, which frays the edges. A region of
 * uniform hexagons reads as generated, because it is.
 */
export function terrainOf(h3: H3Index): TerrainKind {
  const region = hash(`terrain:${cellToParent(h3, CLUSTER_RES)}`);

  const kind: TerrainKind =
    region < 0.13 ? 'water' : region < 0.34 ? 'forest' : region < 0.44 ? 'market' : 'plain';

  if (kind === 'plain') return 'plain';
  return hash(`edge:${h3}`) < 0.72 ? kind : 'plain';
}

export function resourceOf(h3: H3Index): ResourceKind | null {
  return RESOURCE_OF[terrainOf(h3)];
}

/** Add the one-off yield for taking a cell. Returns a new pool; never mutates. */
export function addClaimYield(pool: ResourcePool, h3: H3Index): ResourcePool {
  const resource = resourceOf(h3);
  if (!resource) return pool;
  return { ...pool, [resource]: pool[resource] + CLAIM_YIELD };
}

/**
 * What a set of cells produce over `ms`, counting only the ones awake at `now`.
 *
 * A cell not visited within `DECAY_GRACE_HOURS` earns nothing — the same clock as
 * decay, deliberately, so this needed no ticket-specific timer of its own. Dormancy is
 * checked once against `now`, not resolved minute by minute across the span: a cell
 * that went dormant partway through `ms` is treated as dormant for the whole of it.
 * Settling runs often enough in practice (every trail batch) that this never costs
 * more than a few minutes of trickle either way.
 *
 * Whole units only. Fractions would accumulate rounding differences between the client
 * and the SQL that has to agree with it in Phase 5, and there is nothing to gain from
 * half a log.
 */
export function trickle(cells: readonly Cell[], ms: number, now: number): ResourcePool {
  const hours = Math.max(0, ms) / 3_600_000;
  const pool = { ...EMPTY_POOL };
  for (const cell of cells) {
    if (now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const resource = resourceOf(cell.h3);
    if (resource) pool[resource] += TRICKLE_PER_HOUR * hours;
  }

  const floored = { ...EMPTY_POOL };
  for (const k of RESOURCE_KINDS) floored[k] = Math.floor(pool[k]);
  return floored;
}

export interface ResourceState {
  pool: ResourcePool;
  /** When the trickle was last settled into the pool. */
  since: number;
}

/** The trickle is settled an hour at a time; a partial hour waits for the rest of it. */
const SETTLE_MS = 3_600_000;

/**
 * Bring a stored pool up to date.
 *
 * The same shape as decay — nothing runs on a timer, the answer is computed from the
 * clock whenever it is asked for — with one deliberate difference: this one *is* written
 * back. Resources are earned and kept, so re-deriving them would be double payment
 * rather than double punishment.
 *
 * Which is exactly what an earlier version did. It credited the whole elapsed span but
 * advanced `since` only by whole hours, so every unsettled minute was paid again on the
 * next read, and a HUD that settles on each render mints resources for standing still.
 * Pay for whole hours, move the clock by those same hours, and leave the remainder
 * where it is.
 */
export function settleResources(
  state: ResourceState,
  owned: readonly Cell[],
  now: number,
): ResourceState {
  const elapsed = now - state.since;
  if (elapsed <= 0) return state;

  // Nothing to earn, but the clock still moves — otherwise a player holding only
  // dormant or non-producing ground builds up a debt of hours that pays out the
  // instant a lake is claimed, or an old cell is finally walked again.
  const producing = owned.some(
    (c) => now - c.lastVisitedAt <= DORMANT_AFTER_MS && resourceOf(c.h3) !== null,
  );
  if (!producing) return { pool: state.pool, since: now };

  const paidMs = Math.floor(elapsed / SETTLE_MS) * SETTLE_MS;
  if (paidMs <= 0) return state;

  const earned = trickle(owned, paidMs, now);
  const pool = { ...state.pool };
  for (const k of RESOURCE_KINDS) pool[k] = Math.min(BASE_STORAGE_CAP, pool[k] + earned[k]);

  return { pool, since: state.since + paidMs };
}

/** Can this pool afford that cost? */
export function canAfford(pool: ResourcePool, cost: Partial<ResourcePool>): boolean {
  return (Object.keys(cost) as ResourceKind[]).every((k) => pool[k] >= (cost[k] ?? 0));
}

/** Spend, or return null when the pool cannot cover it. Never goes negative. */
export function spend(pool: ResourcePool, cost: Partial<ResourcePool>): ResourcePool | null {
  if (!canAfford(pool, cost)) return null;
  const next = { ...pool };
  for (const k of Object.keys(cost) as ResourceKind[]) next[k] -= cost[k] ?? 0;
  return next;
}
