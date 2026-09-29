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
/**
 * 100 food a hex — twenty times the first price (Infinite 2026-09-29: *"tee hearthin
 * laajentamisesta 20x kalliimpaa"*). A whole ring at that price is more food than the
 * pouch can hold, so the Hearth now grows a hex at a time: a press buys as many of the
 * next ring's free hexes as the food covers, and the ring is reached when none are left.
 */
export const HEARTH_FOOD_PER_HEX = 100;

/** The most a ring can hold: `6·ring` hexes. */
export const hearthRingHexes = (ring: number): number => 6 * ring;

export type HearthGrowthRefusal = 'at-limit' | 'cannot-afford';

export type HearthGrowthResult =
  | { ok: true; ring: number; bought: number; pool: ResourcePool }
  | { ok: false; refused: HearthGrowthRefusal };

/**
 * Buy what the food covers of the next ring out from `ring`. `free` is how many of its
 * hexes nobody holds — only those are paid for. Refuses before taking anything.
 */
export function growHearth(pool: ResourcePool, ring: number, free: number): HearthGrowthResult {
  if (ring >= HEARTH_MAX_RING) return { ok: false, refused: 'at-limit' };
  // Every hex of the next ring already held: it is reached for nothing.
  if (free <= 0) return { ok: true, ring: ring + 1, bought: 0, pool };
  const bought = Math.min(free, Math.floor(pool.food / HEARTH_FOOD_PER_HEX));
  if (bought < 1) return { ok: false, refused: 'cannot-afford' };
  const cost = { food: bought * HEARTH_FOOD_PER_HEX };
  if (!canAfford(pool, cost)) return { ok: false, refused: 'cannot-afford' };
  const paid = spend(pool, cost);
  if (!paid) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, ring: bought === free ? ring + 1 : ring, bought, pool: paid };
}
