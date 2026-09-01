/**
 * Mana: what a Temple is for (BRDC-MANA-001).
 *
 * `BRDC-DWELL-001` works out where a player spends their life and names those cells —
 * an Anchor and, behind it, temples ranked by time. Until now that was the end of it: a
 * marker and nothing more. This is the consequence. A place you hold and still visit
 * produces mana every hour, the Anchor most of all, and a temple can be expanded — at a
 * rising price in stone and gold — to produce more.
 *
 * It is also the first thing that puts a number on `MAX_DWELL_GAP_MS`. A phone left still
 * for eight hours is credited forty minutes, not eight hours, so a temple cannot be
 * minted from one overnight gap — you have to keep coming back, which is the whole point.
 *
 * Pure and clock-free where it can be: `manaRate`, `expansionCost` and `expandTemple`
 * take no `now`. `manaBonus` takes one only to answer the dormancy question.
 */
import {
  MANA_ANCHOR_RATE,
  MANA_EXPANSION_STEP,
  MANA_RANK_STEP,
  MANA_TEMPLE_MIN,
  MANA_TEMPLE_RATE,
  MAX_TEMPLE_EXPANSION,
} from './constants.js';
import { DORMANT_AFTER_MS, spend } from './terrain.js';
import type { ResourcePool } from './terrain.js';

export type ChannelRefusal = 'cannot-afford' | 'wisdom-full';
export type ChannelResult =
  | { ok: true; pool: ResourcePool }
  | { ok: false; refused: ChannelRefusal };
import type { Place } from './dwell.js';
import type { Cell, H3Index, RevealedPlace } from '../types/domain.js';

export type ExpandRefusal = 'at-max' | 'cannot-afford';
export type ExpandResult =
  | { ok: true; level: number; pool: ResourcePool }
  | { ok: false; refused: ExpandRefusal };

/**
 * What one place produces an hour at a given expansion level. Whole units.
 *
 * The Anchor gets the flat anchor rate. A temple's rate falls one step per rank below the
 * first and floors at `MANA_TEMPLE_MIN`, then expansion multiplies it back up.
 */
export function manaRate(place: Place, expansion: number): number {
  const base =
    place.kind === 'anchor'
      ? MANA_ANCHOR_RATE
      : Math.max(MANA_TEMPLE_MIN, MANA_TEMPLE_RATE - (place.rank - 1) * MANA_RANK_STEP);
  return Math.floor(base * (1 + expansion * MANA_EXPANSION_STEP));
}

/** The cost of the next expansion level (`nextLevel` in 1..`MAX_TEMPLE_EXPANSION`). Rises. */
export function expansionCost(nextLevel: number): Partial<ResourcePool> {
  return { stone: 40 * nextLevel, gold: 30 * nextLevel };
}

/**
 * Per-hour mana from every awake place the player still holds.
 *
 * Gated on ownership and the same 48 h dormancy clock as terrain and buildings
 * (BRDC-ECON-001): a temple you have stopped walking to stops paying. `{}` when there is
 * nothing, so a caller can merge it away.
 */
export function manaBonus(
  places: readonly Place[],
  expansions: Readonly<Record<H3Index, number>>,
  owned: readonly Cell[],
  now: number,
): Partial<ResourcePool> {
  const awake = new Set(
    owned.filter((c) => now - c.lastVisitedAt <= DORMANT_AFTER_MS).map((c) => c.h3),
  );
  let mana = 0;
  for (const place of places) {
    if (awake.has(place.h3)) mana += manaRate(place, expansions[place.h3] ?? 0);
  }
  return mana > 0 ? { mana } : {};
}

/**
 * Spend the pouch to raise a temple's expansion by one step.
 *
 * `ward`'s shape, and clock-free like it: the caller has already established this h3 is a
 * temple and holds its current level. Never mutates `pool`.
 */
export function expandTemple(level: number, pool: ResourcePool): ExpandResult {
  if (level >= MAX_TEMPLE_EXPANSION) return { ok: false, refused: 'at-max' };
  const paid = spend(pool, expansionCost(level + 1));
  if (!paid) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, level: level + 1, pool: paid };
}

/**
 * Channel mana into wisdom at the Altar (BRDC-KEEP-002).
 *
 * A slow path to research for a player who has not built a Library — the Altar makes
 * mana, this turns it into wisdom at a fixed rate. Refuses rather than overfills: if the
 * wisdom would cross the storage cap, nothing is spent. Never mutates `pool`.
 */
export function channelMana(
  pool: ResourcePool,
  manaSpent: number,
  rate: number,
  cap: number,
): ChannelResult {
  const gained = Math.floor(manaSpent / rate);
  if (pool.wisdom + gained > cap) return { ok: false, refused: 'wisdom-full' };
  const paid = spend(pool, { mana: manaSpent });
  if (!paid) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, pool: { ...paid, wisdom: paid.wisdom + gained } };
}

/** Attach `expansion` and `manaPerHour` to each place, for the panels. Pure. */
export function placesWithMana(
  places: readonly RevealedPlace[],
  expansions: Readonly<Record<H3Index, number>>,
): RevealedPlace[] {
  return places.map((p) => {
    const expansion = expansions[p.h3] ?? 0;
    return { ...p, expansion, manaPerHour: manaRate(p, expansion) };
  });
}
