/**
 * Rings to cells.
 *
 * H3 turns a walked loop into a discrete set of hexagons, which is what makes ownership
 * comparable between players and storable at all. Resolution 11 is fixed in
 * supabase/migrations/0001_init.sql, so it is not a knob: changing it means a migration.
 */
import {
  cellArea,
  cellToBoundary,
  cellToLatLng,
  cellToParent,
  gridDisk,
  gridDistance,
  latLngToCell,
  polygonToCells,
} from 'h3-js';
import { H3_RES_OWNERSHIP, H3_RES_REGION } from '../rules/constants.js';
import type { BBox, H3Index, LatLng } from '../types/domain.js';

/**
 * The cells enclosed by a ring.
 *
 * h3-js takes `[lat, lng]` pairs — the opposite order to GeoJSON, and a mistake that
 * silently produces cells in the wrong hemisphere rather than an error.
 *
 * Cells are included when their centre falls inside the ring. That rule is deliberately
 * h3's own and not augmented with an edge buffer of our own: the SQL side (Phase 3) uses
 * the same library, and any local embellishment would put the two out of step and fail
 * the golden-fixture tests for a reason nobody would enjoy finding.
 */
export function ringToCells(ring: readonly LatLng[]): H3Index[] {
  if (ring.length < 3) return [];
  return polygonToCells([ring.map((p) => [p.lat, p.lng])], H3_RES_OWNERSHIP);
}

/** The cell a position falls in, at ownership resolution. */
export function cellAt(position: LatLng): H3Index {
  return latLngToCell(position.lat, position.lng, H3_RES_OWNERSHIP);
}

/** A cell's centre as `{ lat, lng }` — h3-js returns `[lat, lng]`, this hides that. */
export function cellCentre(cell: H3Index): LatLng {
  const [lat, lng] = cellToLatLng(cell);
  return { lat, lng };
}

/** The res-6 region a cell belongs to. Shards realtime channels in Phase 3; keys cells now. */
export function regionOf(cell: H3Index): H3Index {
  return cellToParent(cell, H3_RES_REGION);
}

/** The res-6 region a position falls in, without first resolving the res-11 cell. */
export function regionAt(position: LatLng): H3Index {
  return latLngToCell(position.lat, position.lng, H3_RES_REGION);
}

/**
 * The res-6 regions that could hold a cell inside `bbox`.
 *
 * This is what lets `getCells` be a bounded read: rather than scanning every stored cell,
 * the caller reads only `cell:${region}:` for these regions. Three sources unioned so it
 * stays correct at every size — a phone viewport (smaller than one ~36 km² region), a pan
 * that straddles a region edge, and a zoomed-out box that spans many:
 *   1. every region whose centre lies in the box (`polygonToCells`),
 *   2. the regions the four corners and the centre fall in — the small-box case (1) misses,
 *   3. the immediate neighbours of the corner regions, for a viewport that overlaps a
 *      region without covering its centre.
 *
 * h3-js takes `[lat, lng]`, the reverse of GeoJSON; the wrong order silently returns cells
 * in the wrong hemisphere rather than an error.
 */
export function regionsCoveringBBox(bbox: BBox): H3Index[] {
  const corners: LatLng[] = [
    { lat: bbox.south, lng: bbox.west },
    { lat: bbox.south, lng: bbox.east },
    { lat: bbox.north, lng: bbox.east },
    { lat: bbox.north, lng: bbox.west },
  ];
  const centre: LatLng = {
    lat: (bbox.south + bbox.north) / 2,
    lng: (bbox.west + bbox.east) / 2,
  };

  const regions = new Set<H3Index>(
    polygonToCells([corners.map((p) => [p.lat, p.lng])], H3_RES_REGION),
  );
  for (const seed of [...corners, centre].map(regionAt)) {
    for (const near of gridDisk(seed, 1)) regions.add(near);
  }
  return [...regions];
}

/**
 * The six cells touching this one.
 *
 * `gridDisk(cell, 1)` returns seven — the ring plus the cell itself — and forgetting
 * that would quietly grant every cell a neighbour bonus for being its own neighbour.
 */
export function neighboursOf(cell: H3Index): H3Index[] {
  return gridDisk(cell, 1).filter((c) => c !== cell);
}

/**
 * Every cell within `radius` steps of `centre`, the centre included.
 *
 * The area a building's effect reaches (BRDC-BUILD-003) — `radius` 1 is the seven-cell
 * disk, 2 is nineteen. Keeps h3-js's `gridDisk` from leaking past `packages/core/geo`.
 */
export function cellsWithin(centre: H3Index, radius: number): H3Index[] {
  return gridDisk(centre, Math.max(0, radius));
}

/** Grid steps between two cells — how a Trade Route measures its span (BRDC-BUILD-004). */
export function hexDistance(a: H3Index, b: H3Index): number {
  return gridDistance(a, b);
}

/**
 * True area of a cell in m².
 *
 * H3 cells are not equal-area. The nominal 2150 m² is a global mean; at Tampere's
 * latitude a res-11 cell is about 1622 m². Anything shown to a player comes from here.
 */
export function cellAreaM2(cell: H3Index): number {
  return cellArea(cell, 'm2');
}

/** Total area of a set of cells, measured rather than estimated. */
export function totalAreaM2(cells: readonly H3Index[]): number {
  let total = 0;
  for (const cell of cells) total += cellArea(cell, 'm2');
  return total;
}

/**
 * The hexagon's corners, in GeoJSON order.
 *
 * h3-js returns `[lat, lng]`; GeoJSON wants `[lng, lat]`. Swapping it here, once, keeps
 * the mistake from being made again in every renderer — and getting it wrong draws the
 * whole territory somewhere off the coast of Africa rather than raising an error.
 *
 * This also means nothing outside packages/core needs to depend on h3-js.
 */
export function cellBoundary(cell: H3Index): Array<[number, number]> {
  return cellToBoundary(cell).map(([lat, lng]) => [lng, lat] as [number, number]);
}
