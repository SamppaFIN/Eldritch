/**
 * Forward geodesy: given a point, a bearing and a distance, where do you end up?
 *
 * Needed by the walk simulator (BRDC-SIM-001) and later by the H3 rasteriser. It lives
 * in geo/ rather than sim/ because it is real geometry, not test scaffolding — the same
 * spherical model as haversine, so the two are exact inverses of each other.
 */
import type { LatLng } from '../types/domain.js';
import { EARTH_RADIUS_M, toDeg, toRad } from './haversine.js';

/** Initial bearing from `a` to `b`, degrees clockwise from north (0-360). */
export function bearing(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** The point `distanceM` away from `from` along `bearingDeg`. */
export function destination(from: LatLng, bearingDeg: number, distanceM: number): LatLng {
  const angular = distanceM / EARTH_RADIUS_M;
  const brg = toRad(bearingDeg);
  const lat1 = toRad(from.lat);
  const lng1 = toRad(from.lng);

  const sinLat2 =
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(brg);
  const lat2 = Math.asin(sinLat2);

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brg) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * sinLat2,
    );

  return {
    lat: toDeg(lat2),
    // Normalise into -180..180 so a walk across the antimeridian stays sane.
    lng: (((toDeg(lng2) + 540) % 360) - 180),
  };
}
