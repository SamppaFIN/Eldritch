/**
 * A hex's shape, worked out once (BRDC-PERF-003).
 *
 * Drawing the territory asked h3-js for every hex's boundary, centre and neighbours on
 * every rebuild — for a thousand hexes, several times a second. A hex's shape never
 * changes, so each is computed once and kept. Returned arrays are shared: callers read
 * them and never write to them.
 *
 * `cellRing` is closed (first vertex repeated last), as a GeoJSON polygon ring must be;
 * `cellBoundary` in `cells.ts` stays open for the callers that count its six corners.
 */
import { cellToBoundary, cellToLatLng, gridDisk } from 'h3-js';
import type { H3Index } from '../types/domain.js';

/** Past this many hexes the caches start over, so a long session cannot grow them forever. */
export const GEOMETRY_CACHE_MAX = 50_000;

const rings = new Map<H3Index, readonly [number, number][]>();
const centres = new Map<H3Index, readonly [number, number]>();
const rims = new Map<H3Index, readonly H3Index[]>();
let computed = 0;

function remember<V>(cache: Map<H3Index, V>, h3: H3Index, make: () => V): V {
  const hit = cache.get(h3);
  if (hit !== undefined) return hit;
  if (cache.size >= GEOMETRY_CACHE_MAX) cache.clear();
  const value = make();
  computed += 1;
  cache.set(h3, value);
  return value;
}

/** The hex outline as a closed GeoJSON ring, `[lng, lat]`. */
export function cellRing(h3: H3Index): readonly [number, number][] {
  return remember(rings, h3, () => {
    const open = cellToBoundary(h3).map(([lat, lng]) => [lng, lat] as [number, number]);
    return open.length > 0 ? [...open, open[0] as [number, number]] : open;
  });
}

/** The hex centre, `[lng, lat]`. */
export function cellCentreLngLat(h3: H3Index): readonly [number, number] {
  return remember(centres, h3, () => {
    const [lat, lng] = cellToLatLng(h3);
    return [lng, lat] as const;
  });
}

/** The six hexes around one, itself not included. */
export function cellNeighbours(h3: H3Index): readonly H3Index[] {
  return remember(rims, h3, () => gridDisk(h3, 1).filter((n) => n !== h3));
}

/** How many shapes have been computed since start — for tests that count work. */
export function geometryWork(): number {
  return computed;
}
