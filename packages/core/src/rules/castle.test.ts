import { describe, expect, it } from 'vitest';
import { haversine } from '../geo/haversine.js';
import { castlePosition } from './castle.js';
import { CASTLE_MAX_RADIUS_M, CASTLE_MIN_RADIUS_M } from './constants.js';

const HOME = { lat: 61.47290805294704, lng: 23.725882485862012 };

/**
 * A seed that does not look like `spread-0`, `spread-1`, ... — FNV-1a barely mixes a
 * long shared prefix with a small trailing counter, so a first version of this test
 * using seeds exactly that shape saw 200 samples land in two compass quadrants out of
 * four. Real seeds are `crypto.randomUUID()` (`data/castle.ts`), which do not have that
 * shape; this scrambles the loop index so the test does not accidentally have it either.
 */
function seed(i: number): string {
  return String((i * 2_654_435_761) % 1_000_000_007);
}

describe('castlePosition', () => {
  it('is deterministic: the same seed always gives the same Keep', () => {
    expect(castlePosition(HOME, seed(1))).toEqual(castlePosition(HOME, seed(1)));
  });

  it('gives different seeds different Keeps', () => {
    expect(castlePosition(HOME, seed(1))).not.toEqual(castlePosition(HOME, seed(2)));
  });

  it('never sits on the Hearth itself', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(haversine(HOME, castlePosition(HOME, seed(i)))).toBeGreaterThan(0);
    }
  });

  it('stays within the declared ring around the Hearth', () => {
    for (let i = 0; i < 200; i += 1) {
      const distance = haversine(HOME, castlePosition(HOME, seed(i)));
      expect(distance).toBeGreaterThanOrEqual(CASTLE_MIN_RADIUS_M - 1);
      expect(distance).toBeLessThanOrEqual(CASTLE_MAX_RADIUS_M + 1);
    }
  });

  it('spreads across the whole ring, not just one arc or one radius', () => {
    // A bug that reused one hash for both bearing and radius would still pass the
    // determinism and bounds tests above — it would just tie the two together, so a
    // seed landing far would always land in the same slice of the compass. Enough
    // samples should cover more than a quarter of the compass and both halves of the
    // radius range if the two are genuinely independent.
    const keeps = Array.from({ length: 60 }, (_, i) => castlePosition(HOME, seed(i)));
    const bearingOf = (p: (typeof keeps)[number]) => {
      const dLng = p.lng - HOME.lng;
      const dLat = p.lat - HOME.lat;
      return (Math.atan2(dLng, dLat) * 180) / Math.PI;
    };

    const quadrants = new Set(keeps.map((p) => Math.floor(((bearingOf(p) + 360) % 360) / 90)));
    expect(quadrants.size).toBeGreaterThanOrEqual(3);

    const mid = (CASTLE_MIN_RADIUS_M + CASTLE_MAX_RADIUS_M) / 2;
    const distances = keeps.map((p) => haversine(HOME, p));
    expect(distances.some((d) => d < mid)).toBe(true);
    expect(distances.some((d) => d > mid)).toBe(true);
  });
});
