/**
 * The scattered cipher (BRDC-CIPHER-001).
 *
 * A handful of cells, out on the ground somewhere, hold a fragment — a line of a writing
 * and a chord of a sigil. Seven of them assemble into one inscription and one seven-
 * pointed star, and Phase 2 turns that into a place you can walk to.
 *
 * Where the fragments are is not luck. A salted FNV hash of the H3 index, the same
 * discipline as `reveal.ts` and `terrain.ts`: the same fragments on the same ground for
 * every phone, forever, and a reload does not re-roll them. Only ordinary (`common`)
 * ground carries one, so the rare/legendary cells stay what they already are.
 */
import { revealOf } from './reveal.js';

export const SHARD_COUNT = 7;

/** ~1.4% of common cells — roughly 1% of all ground. */
const SITE_BELOW = 0.014;

/** FNV-1a over the salted index, in [0, 1). Copied from `reveal.ts` / `anomaly.ts`. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** The fragment index (`0..SHARD_COUNT-1`) on the cell at `h3`, or `null` for plain ground. */
export function cipherShardAt(h3: string): number | null {
  if (revealOf(h3) !== 'common') return null;
  if (hash(`cipher:site:${h3}`) >= SITE_BELOW) return null;
  return Math.floor(hash(`cipher:idx:${h3}`) * SHARD_COUNT);
}

/** True once every fragment index is held. Order- and duplicate-tolerant. */
export function cipherComplete(held: readonly number[]): boolean {
  const seen = new Set(held);
  for (let i = 0; i < SHARD_COUNT; i += 1) if (!seen.has(i)) return false;
  return true;
}
