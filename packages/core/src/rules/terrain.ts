/**
 * What the ground under a cell is made of.
 *
 * Owning territory has meant a number going up. This is what makes one cell worth more
 * than another: a lake gives water, woodland gives timber, a parade of shops gives gold.
 * You cannot choose where those are — they are where you live — so the map decides what
 * a walk is worth, which is the whole point of a game played outdoors.
 *
 * **The data source here is a placeholder and that is said out loud.** Terrain is a
 * deterministic hash of the H3 index, clustered so it forms woods and lakes rather than
 * per-cell noise. It is not real terrain; it is the shape real terrain will fill. The
 * interface — `terrainOf(h3)` — is what stays when the vector tiles already on the
 * device are read instead (PIVOT-2026-08-27 §3.1).
 */
import { cellToParent } from 'h3-js';
import type { H3Index } from '../types/domain.js';

export type TerrainKind = 'water' | 'forest' | 'market' | 'plain';
export type ResourceKind = 'water' | 'wood' | 'gold';

export interface ResourcePool {
  water: number;
  wood: number;
  gold: number;
}

export const EMPTY_POOL: ResourcePool = { water: 0, wood: 0, gold: 0 };

/** What each terrain gives. Plain gives nothing, and most ground is plain. */
export const RESOURCE_OF: Readonly<Record<TerrainKind, ResourceKind | null>> = {
  water: 'water',
  forest: 'wood',
  market: 'gold',
  plain: null,
};

/** Paid once, the moment a producing cell changes hands. */
export const CLAIM_YIELD = 10;
/** Paid for holding it, per producing cell, per hour. */
export const TRICKLE_PER_HOUR = 2;

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
 * What a set of held cells produces over a span of time.
 *
 * Whole units only. Fractions would accumulate rounding differences between the client
 * and the SQL that has to agree with it in Phase 3, and there is nothing to gain from
 * half a log.
 */
export function trickle(cells: readonly H3Index[], ms: number): ResourcePool {
  const hours = Math.max(0, ms) / 3_600_000;
  const pool = { ...EMPTY_POOL };
  for (const h3 of cells) {
    const resource = resourceOf(h3);
    if (resource) pool[resource] += TRICKLE_PER_HOUR * hours;
  }
  return { water: Math.floor(pool.water), wood: Math.floor(pool.wood), gold: Math.floor(pool.gold) };
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
  owned: readonly H3Index[],
  now: number,
): ResourceState {
  const elapsed = now - state.since;
  if (elapsed <= 0) return state;

  // Nothing to earn, but the clock still moves — otherwise a player holding only plain
  // ground builds up a debt of hours that pays out the instant they claim a lake.
  const producing = owned.filter((h3) => resourceOf(h3) !== null).length;
  if (producing === 0) return { pool: state.pool, since: now };

  const paidMs = Math.floor(elapsed / SETTLE_MS) * SETTLE_MS;
  if (paidMs <= 0) return state;

  const earned = trickle(owned, paidMs);
  return {
    pool: {
      water: state.pool.water + earned.water,
      wood: state.pool.wood + earned.wood,
      gold: state.pool.gold + earned.gold,
    },
    since: state.since + paidMs,
  };
}

/** Can this pool afford that cost? */
export function canAfford(pool: ResourcePool, cost: Partial<ResourcePool>): boolean {
  return (Object.keys(cost) as ResourceKind[]).every((k) => pool[k] >= (cost[k] ?? 0));
}

/** Spend, or return null when the pool cannot cover it. Never goes negative. */
export function spend(pool: ResourcePool, cost: Partial<ResourcePool>): ResourcePool | null {
  if (!canAfford(pool, cost)) return null;
  return {
    water: pool.water - (cost.water ?? 0),
    wood: pool.wood - (cost.wood ?? 0),
    gold: pool.gold - (cost.gold ?? 0),
  };
}
