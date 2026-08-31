/**
 * The Keep: a public decoy near the Hearth, never the Hearth itself.
 *
 * The Hearth is a res-11 cell — about 46 m across in Tampere, which is an address, not
 * a neighbourhood. Once territory is shared (BRDC-SHARE-001), that address is exactly
 * what must never leave the device. The Keep is the thing that gets published instead:
 * close enough to read as "this player's corner of town", far enough that it is not
 * the door.
 *
 * This function is deterministic in `seed` on purpose, and that is the only thing it
 * is deterministic in. Nothing here may take the Hearth's own position as its only
 * input, because a public, repeatable formula from a public position is a formula
 * anyone can run backwards. The real secrecy lives entirely in where `seed` comes from
 * — generated once, with real entropy, when the Hearth is accepted
 * (`data/castle.ts#assignCastle`) — never derived from anything public.
 */
import { destination } from '../geo/project.js';
import { CASTLE_MAX_RADIUS_M, CASTLE_MIN_RADIUS_M } from './constants.js';
import type { LatLng } from '../types/domain.js';

/**
 * FNV-1a over the seed. Same construction as terrainOf — cheap, stable, evenly spread
 * for the kind of input this project actually feeds it: H3 indices there, a fresh
 * `crypto.randomUUID()` here. It is a poor mix for a *sequential* input sharing a long
 * prefix — `keep:bearing:seed-0` through `keep:bearing:seed-199` clustered into two of
 * four compass quadrants when this was first tested. Never seed this with a counter.
 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Where the Keep sits, given the Hearth's position and a seed.
 *
 * Two independent hashes of the same seed, not one split in half: a single hash reused
 * for both bearing and radius would correlate them (the same seed always landing, say,
 * far-and-north or near-and-south), which is exactly the kind of pattern that turns
 * "random-looking" into "predictable" over enough Keeps.
 */
export function castlePosition(home: LatLng, seed: string): LatLng {
  const bearingDeg = hash(`keep:bearing:${seed}`) * 360;
  const radiusM =
    CASTLE_MIN_RADIUS_M + hash(`keep:radius:${seed}`) * (CASTLE_MAX_RADIUS_M - CASTLE_MIN_RADIUS_M);
  return destination(home, bearingDeg, radiusM);
}
