/**
 * Seeded neighbours.
 *
 * An empty map is a bad first impression and a worse test bed: with nothing to contest,
 * the siege mechanic (BRDC-CLAIM-003) cannot be exercised at all. So the first time the
 * game learns where the player is, three rivals appear around them.
 *
 * Positions are relative to the player's first fix, never hard-coded — the game has to
 * work in Tampere, in Turku, and on a test rig in a different hemisphere.
 */
import { gridDisk, latLngToCell } from 'h3-js';
import { destination } from '../geo/project.js';
import { BASE_STRENGTH, H3_RES_OWNERSHIP, MAX_STRENGTH } from '../rules/constants.js';
import { prng } from '../sim/walk.js';
import type { Cell, LatLng, PlayerId } from '../types/domain.js';

export interface SeedNeighbour {
  id: PlayerId;
  name: string;
  colorHue: number;
}

/**
 * Three rivals with lore-shaped names.
 *
 * The first is deliberately close and deliberately weak: a player who walks for ten
 * minutes should be able to reach a contested edge on their first outing, and see the
 * siege model do something before they have any reason to trust it.
 */
export const SEED_NEIGHBOURS: readonly SeedNeighbour[] = [
  { id: 'seed-warden', name: 'The Pale Warden', colorHue: 190 },
  { id: 'seed-choir', name: 'Choir of Small Hours', colorHue: 45 },
  { id: 'seed-remnant', name: 'Remnant of Kuu', colorHue: 320 },
];

interface Plan {
  neighbour: SeedNeighbour;
  /** Metres from the player's first fix. */
  distanceM: number;
  bearingDeg: number;
  /** gridDisk radius; 2 gives 19 cells, 3 gives 37. */
  rings: number;
  strength: number;
}

const PLANS: readonly Omit<Plan, 'neighbour'>[] = [
  // Close enough to reach on a first walk, weak enough to actually take.
  { distanceM: 260, bearingDeg: 55, rings: 2, strength: BASE_STRENGTH },
  { distanceM: 900, bearingDeg: 200, rings: 3, strength: 240 },
  // Established. Taking this needs several walks on separate days, by design.
  { distanceM: 1500, bearingDeg: 310, rings: 3, strength: MAX_STRENGTH },
];

/**
 * Build the starting neighbourhood around `origin`.
 *
 * `now` is passed in rather than read: seeded cells need a plausible `lastVisitedAt`,
 * and a decay test that fast-forwards the clock must be able to control it.
 */
export function seedCells(origin: LatLng, now: number, seed = 20260826): Cell[] {
  const rnd = prng(seed);
  const cells: Cell[] = [];
  const taken = new Set<string>();

  SEED_NEIGHBOURS.forEach((neighbour, i) => {
    const plan = PLANS[i] as Omit<Plan, 'neighbour'>;
    const centre = destination(origin, plan.bearingDeg, plan.distanceM);
    const centreCell = latLngToCell(centre.lat, centre.lng, H3_RES_OWNERSHIP);

    /*
     * Only the outermost ring is ragged.
     *
     * Skipping any cell at random punched holes through the middle of a rival's home
     * ground, which the map draws exactly like ground somebody has fought their way
     * into. A first launch showed three neighbourhoods that looked half-besieged before
     * the player had taken a step.
     */
    const interior = new Set(plan.rings > 0 ? gridDisk(centreCell, plan.rings - 1) : []);

    for (const h3 of gridDisk(centreCell, plan.rings)) {
      // Overlapping disks would otherwise let a later neighbour silently annex an
      // earlier one's cells, which is the one thing seeding must not fake.
      if (taken.has(h3)) continue;
      taken.add(h3);

      // Ragged edges: a perfect hexagonal blob reads as generated, because it is.
      if (!interior.has(h3) && rnd() < 0.3) continue;

      cells.push({
        h3,
        ownerId: neighbour.id,
        /*
         * Varied upward only, never below the plan's strength.
         *
         * A ±15% spread put roughly half of every rival's home ground under
         * BASE_STRENGTH, which is what the map draws as contested — so a first
         * launch showed three neighbourhoods apparently under siege before anyone
         * had taken a step. The soft spots are supposed to be earned.
         */
        strength: Math.round(plan.strength * (1 + rnd() * 0.35)),
        lastVisitedAt: now,
        visitDays: [],
      });
    }
  });

  return cells;
}
