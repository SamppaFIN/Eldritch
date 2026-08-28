/**
 * Spending resources on ground you already hold.
 *
 * The first thing a pouch is for. Until now resources accumulated and did nothing, and
 * the only way to keep a cell was to walk to it — which is correct as the *spine* of the
 * game and miserable as its only verb. Warding lets a player who has been collecting
 * timber and water spend it to shore up an edge they cannot reach today.
 *
 * **Warding does not reset the decay clock, and that is the whole balance of it.**
 * Strength goes up; `lastVisitedAt` does not move. Resources buy a cell more time before
 * the Void takes it, never immunity — a player who stops walking still loses their map,
 * just more slowly. Advancing the clock here would quietly turn a walking game into an
 * idle one, which is the single change most likely to hollow this out.
 */
import { MAX_STRENGTH } from './constants.js';
import { canAfford, spend } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import type { Cell, PlayerId } from '../types/domain.js';

/**
 * What one warding costs, and what it buys.
 *
 * Timber only, and deliberately so. The first version wanted timber *and* water, which
 * read well until a test walked a real neighbourhood and found no lake within 750 m of
 * it — and that is most neighbourhoods. A cost that demands terrain the player has no
 * way to acquire is not a difficulty curve, it is a locked door.
 *
 * Terrain variety earns its keep in what gets built later, where a well can want water
 * and a market can want gold. The everyday verb takes the everyday material.
 */
export const WARD_COST: Readonly<Partial<ResourcePool>> = { wood: 25 };
export const WARD_STRENGTH = 60;

export type WardRefusal = 'not-yours' | 'already-full' | 'cannot-afford';

export type WardResult =
  | { warded: true; cell: Cell; pool: ResourcePool }
  | { warded: false; refused: WardRefusal };

/**
 * Ward one cell.
 *
 * `now` is deliberately absent. Nothing here depends on the clock — that is the point,
 * and a parameter would invite someone to start using it.
 */
export function ward(cell: Cell, pool: ResourcePool, me: PlayerId): WardResult {
  if (cell.ownerId !== me) return { warded: false, refused: 'not-yours' };
  if (cell.strength >= MAX_STRENGTH) return { warded: false, refused: 'already-full' };
  if (!canAfford(pool, WARD_COST)) return { warded: false, refused: 'cannot-afford' };

  const paid = spend(pool, WARD_COST);
  // canAfford has already answered this; the null is the type system asking again.
  if (!paid) return { warded: false, refused: 'cannot-afford' };

  return {
    warded: true,
    // Capped, and the overflow is not refunded — a full cell refuses the ward outright
    // above, so the only way to reach the cap here is to have wanted the last of it.
    cell: { ...cell, strength: Math.min(MAX_STRENGTH, cell.strength + WARD_STRENGTH) },
    pool: paid,
  };
}

/** How many wards this pouch could pay for. Drives the readout, not the rule. */
export function wardsAffordable(pool: ResourcePool): number {
  return Math.min(
    ...(Object.entries(WARD_COST) as [keyof ResourcePool, number][]).map(([k, cost]) =>
      Math.floor(pool[k] / cost),
    ),
  );
}
