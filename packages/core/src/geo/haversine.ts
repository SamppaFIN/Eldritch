/**
 * Great-circle distance. Pure, no DOM, no dependencies.
 *
 * A spherical earth is the right model here: the largest thing we ever measure is a
 * walked loop of a few hundred metres, where the difference between a sphere and the
 * WGS-84 ellipsoid is well under the GPS noise we are already filtering out.
 */
import type { LatLng } from '../types/domain.js';

/** Mean earth radius, metres (IUGG). */
export const EARTH_RADIUS_M = 6_371_008.8;

export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Distance between two points in metres. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  // atan2 form rather than asin: stable for antipodal points.
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Total length of a point sequence, metres. */
export function pathLength(points: readonly LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1] as LatLng, points[i] as LatLng);
  }
  return total;
}
