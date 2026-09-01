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
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Thresholds over the hash, cumulative from 0. ~1% legendary and ~5% rare are the plan's
 * own numbers (§8.1); they are gates across a hash, not dice.
 */
const LEGENDARY_BELOW = 0.01;
const RARE_BELOW = 0.06;
const UNCOMMON_BELOW = 0.25;

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
