/**
 * Enclosed area of a walked ring.
 *
 * This is the function that decides whether a walk is a loop. Distance alone cannot:
 * walking to the end of the street and back ends within metres of where it started and
 * would satisfy any proximity test, while enclosing nothing at all. Area is what tells
 * the two apart, and it is why `back-and-forth.json` exists as a fixture.
 */
import type { LatLng } from '../types/domain.js';
import { toRad } from './haversine.js';

/** Metres per degree of latitude. Constant enough at the scale of a city block. */
const M_PER_DEG_LAT = 111_320;

/**
 * Shoelace area in a local equirectangular projection, in m².
 *
 * A loop is a few hundred metres across, where the projection error is far below the
 * GPS noise already filtered out. A geodesic area would be more correct and no more
 * useful — the smallest thing this feeds is an H3 cell about 40 m wide.
 *
 * The ring is treated as closed: the last point joins back to the first.
 *
 * Projected about the ring's mean latitude rather than its first point, so the answer
 * does not depend on where the walker happened to start or which way round they went.
 * A first-point origin makes the same lap measure differently depending on its starting
 * corner — a small difference, and a wrong one.
 */
export function polygonAreaM2(ring: readonly LatLng[]): number {
  if (ring.length < 3) return 0;

  const mPerDegLng = M_PER_DEG_LAT * Math.cos(toRad(meanLat(ring)));

  let twiceArea = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i] as LatLng;
    const b = ring[(i + 1) % ring.length] as LatLng;
    twiceArea += a.lng * mPerDegLng * (b.lat * M_PER_DEG_LAT) -
      b.lng * mPerDegLng * (a.lat * M_PER_DEG_LAT);
  }

  return Math.abs(twiceArea) / 2;
}

/**
 * Signed area, positive for a counter-clockwise ring.
 *
 * Not needed to decide whether something is a loop, but H3's rasteriser and any future
 * winding-order work will want it, and deriving it twice invites the two to disagree.
 */
export function signedAreaM2(ring: readonly LatLng[]): number {
  if (ring.length < 3) return 0;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos(toRad(meanLat(ring)));

  let twiceArea = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i] as LatLng;
    const b = ring[(i + 1) % ring.length] as LatLng;
    twiceArea += a.lng * mPerDegLng * (b.lat * M_PER_DEG_LAT) -
      b.lng * mPerDegLng * (a.lat * M_PER_DEG_LAT);
  }

  return twiceArea / 2;
}

function meanLat(ring: readonly LatLng[]): number {
  let sum = 0;
  for (const p of ring) sum += p.lat;
  return sum / ring.length;
}
