/**
 * A real place, revealed rather than built (BRDC-LANDMARK-001).
 *
 * Worldseed's own line: *"This is where the world stops being generated and starts being
 * Tampere."* A landmark is not a bounty (it is not found by chance, it simply *is* the
 * statue or the church that stands there) and not a building (nobody built it, holding the
 * hex is what pays) — its own small rule, the same shape as `bountyOn`'s dormancy check.
 */
import { DECAY_GRACE_HOURS } from './constants.js';
import { hexSeedOf } from '../data/hexSeedStore.js';
import type { HexSeedLandmark } from '../types/hexSeed.js';
import type { ResourcePool } from './terrain.js';
import type { Cell, H3Index } from '../types/domain.js';

/** Worldseed §05: "+2 culture" for holding the ground a landmark stands on. */
export const LANDMARK_CULTURE_PER_HOUR = 2;

const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

/** The real-world place on this hex, or `null` — seeded data only, never guessed. */
export function landmarkOn(h3: H3Index): HexSeedLandmark | null {
  return hexSeedOf(h3)?.landmark ?? null;
}

/**
 * Culture from every landmark hex held that is awake. No reveal gate, unlike a bounty —
 * the statue is not a secret waiting to be found; it is simply there, the moment you hold
 * the ground under it.
 */
export function landmarkBonus(cells: readonly Cell[], now: number): Partial<ResourcePool> {
  let culture = 0;
  for (const cell of cells) {
    if (now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    if (landmarkOn(cell.h3)) culture += LANDMARK_CULTURE_PER_HOUR;
  }
  return culture > 0 ? { culture } : {};
}
