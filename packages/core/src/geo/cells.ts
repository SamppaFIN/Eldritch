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
  cellToParent,
  gridDisk,
  latLngToCell,
  polygonToCells,
} from 'h3-js';
import { H3_RES_OWNERSHIP, H3_RES_REGION } from '../rules/constants.js';
import type { H3Index, LatLng } from '../types/domain.js';

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

/** The res-6 region a cell belongs to. Used to shard realtime channels in Phase 3. */
export function regionOf(cell: H3Index): H3Index {
  return cellToParent(cell, H3_RES_REGION);
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
