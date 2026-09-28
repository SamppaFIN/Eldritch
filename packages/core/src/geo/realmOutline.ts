/**
 * A realm's border as one shape (BRDC-PERF-004).
 *
 * Zoomed out, a thousand hex outlines are a grey smear that still costs a thousand lines
 * to draw. Below zoom 14 the map draws the realm's outer edge instead — every held hex
 * merged into one multipolygon by h3-js, holes and all. Remembered for the last set it
 * was asked about, so an unchanged realm is not merged again on every draw.
 */
import { cellsToMultiPolygon } from 'h3-js';
import type { H3Index } from '../types/domain.js';

/** GeoJSON MultiPolygon coordinates, `[lng, lat]`, rings closed. */
export type OutlineCoords = number[][][][];

let lastKey = '';
let lastValue: OutlineCoords = [];

export function realmOutline(cells: readonly H3Index[]): OutlineCoords {
  const key = [...cells].sort().join(',');
  if (key === lastKey) return lastValue;
  lastKey = key;
  lastValue = cells.length === 0 ? [] : (cellsToMultiPolygon([...new Set(cells)], true) as OutlineCoords);
  return lastValue;
}
