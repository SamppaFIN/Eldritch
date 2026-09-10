/**
 * What a cell turns out to be worth the first time it is seen (BRDC-REVEAL-001).
 *
 * A rarity tier, from a deterministic hash of the H3 index — the same discipline as
 * `terrainOf`, and for the same reasons. Never `Math.random()`: two players on the same
 * street must see the same ground, a reload must not re-roll it, and the Phase 5 golden
 * fixtures need SQL and TypeScript to agree on it. The find is in the *place*, not in luck.
 *
 * This is only the tier. A `legendary` cell is a wonder *site* — its content is
 * `BRDC-WONDER-001`; a `rare` one is an anomaly *site* — its story is `BRDC-EVENT-001`.
 */
import { CLAIM_YIELD, resourceOf } from './terrain.js';
import type { ResourcePool } from './terrain.js';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Thresholds over the hash, cumulative from 0. Gates across a hash, not dice.
 *
 * Raised from the plan's §8.1 numbers (1 % / 5 % / 19 %) on 2026-09-10, because those were
 * written for a game where revealing was a rare event and it turned out to be something a
 * player does on every hex they take. Three quarters of reveals landed on `common`, which
 * pays double a claim and reads as nothing at all. Half is still the ordinary case; the
 * other half is now worth the tap.
 */
const LEGENDARY_BELOW = 0.02;
const RARE_BELOW = 0.12;
const UNCOMMON_BELOW = 0.45;

/** FNV-1a over the salted index. The same cheap, stable spread `terrain.ts` thresholds on. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** The rarity of the cell at `h3` — the same answer for everyone, every device, forever. */
export function revealOf(h3: string): Rarity {
  const roll = hash(`reveal:${h3}`);
  if (roll < LEGENDARY_BELOW) return 'legendary';
  if (roll < RARE_BELOW) return 'rare';
  if (roll < UNCOMMON_BELOW) return 'uncommon';
  return 'common';
}

/** The share of cells in each tier, for a readout and for the distribution test. */
export const RARITY_SHARE: Readonly<Record<Rarity, number>> = {
  legendary: LEGENDARY_BELOW,
  rare: RARE_BELOW - LEGENDARY_BELOW,
  uncommon: UNCOMMON_BELOW - RARE_BELOW,
  common: 1 - UNCOMMON_BELOW,
};

/**
 * What revealing a cell pays, as a multiple of `CLAIM_YIELD` of its terrain resource
 * (BRDC-CLAIM-009). Free, once per cell — the reward for looking, not a trade. Tunable.
 */
export const REVEAL_MULT: Readonly<Record<Rarity, number>> = {
  common: 2,
  uncommon: 4,
  rare: 8,
  legendary: 16,
};

/**
 * What plain ground pays instead of a resource it does not have.
 *
 * `TERRAIN_TABLE.plain.resource` is null, and plain is about **two thirds of the map**
 * (52 % of regions outright, plus the frayed edges of the other six). So two reveals in
 * three used to pay *nothing whatsoever* and the button was, accurately, doing nothing.
 *
 * Wisdom, because revealing is the act of looking and wisdom is what looking gives — and
 * because the player this hurt most was the one whose neighbourhood is all plain, who had
 * no other way to reach Research at all.
 */
export const PLAIN_REVEAL_RESOURCE = 'wisdom' as const;

/**
 * The pouch bonus for revealing the ground at `h3`.
 *
 * Its terrain resource, scaled by the tier — a forest cell pays timber, a market gold,
 * plain ground pays nothing but its tier can still carry a token or two. Deterministic,
 * like everything else here.
 */
export function revealBonus(h3: string): Partial<ResourcePool> {
  const tier = revealOf(h3);
  // Never nothing: ground with no resource of its own pays wisdom for the looking.
  const resource = resourceOf(h3) ?? PLAIN_REVEAL_RESOURCE;
  const out: Partial<ResourcePool> = { [resource]: CLAIM_YIELD * REVEAL_MULT[tier] };
  if (tier === 'legendary') out.tokens = 3;
  else if (tier === 'rare') out.tokens = 1;
  return out;
}
