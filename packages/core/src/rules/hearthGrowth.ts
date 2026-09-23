/**
 * Growing the Hearth with food (BRDC-HEARTH-003).
 *
 * The Hearth is founded as a cell and its ring of six. Infinite asked for the way Civilization
 * grows a city — pay, and the border moves out one ring — with food as the price: *"käyttämällä
 * ruokaa voi kasvattaa omaa hearthia toivotusti"*. A ring is every hex exactly `n` steps from the
 * Hearth, `6n` of them, and it costs a fixed amount of food per hex, so the next ring is always
 * dearer than the last and the last one still fits under the pouch's own ceiling
 * (`BASE_STORAGE_CAP`). Only ground nobody holds is taken: this buys land, it does not take it.
 *
 * Pure, like `ward.ts` — the store seam moves the food and writes the cells.
 */
import { canAfford, spend } from './terrain.js';
import type { ResourcePool } from './terrain.js';

/** The founding ring — the Hearth and its six neighbours — is ring 1. */
export const HEARTH_START_RING = 1;
/** Out to 127 hexes. Past this a Hearth is a province, and the map already has a word for that. */
export const HEARTH_MAX_RING = 6;
export const HEARTH_FOOD_PER_HEX = 5;

/** The most a ring can hold: `6·ring` hexes. */
export const hearthRingHexes = (ring: number): number => 6 * ring;

/** What reaching `ring` costs, at a fixed price for each hex actually bought. */
export function hearthRingCost(ring: number, hexes = hearthRingHexes(ring)): Partial<ResourcePool> {
  return { food: hexes * HEARTH_FOOD_PER_HEX };
}

export type HearthGrowthRefusal = 'at-limit' | 'cannot-afford';

export type HearthGrowthResult =
  | { ok: true; ring: number; pool: ResourcePool }
  | { ok: false; refused: HearthGrowthRefusal };

/**
 * Pay for the next ring out from `ring`. Refuses before taking anything.
 *
 * `hexes` is how many of that ring are actually free to buy — a hex the player already
 * holds, or a rival does, is not charged for, so the price is for ground received.
 */
export function growHearth(
  pool: ResourcePool,
  ring: number,
  hexes = hearthRingHexes(ring + 1),
): HearthGrowthResult {
  if (ring >= HEARTH_MAX_RING) return { ok: false, refused: 'at-limit' };
  const next = ring + 1;
  const cost = hearthRingCost(next, hexes);
  if (!canAfford(pool, cost)) return { ok: false, refused: 'cannot-afford' };
  const paid = spend(pool, cost);
  if (!paid) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, ring: next, pool: paid };
}
