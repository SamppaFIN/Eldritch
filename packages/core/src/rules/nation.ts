/**
 * The figures a nation shows beside its flag (BRDC-NATION-001).
 *
 * Pure and small: how many separate provinces the player holds, and a population number.
 * Neither is a mechanic — there is no growth, no food, no unrest. The population is a
 * gauge on the ground and the buildings, nothing more, so it lives here as a formula
 * rather than a stored field that could drift.
 */
import { POP_PER_BUILDING, POP_PER_CELL } from './constants.js';
import { regionOf } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

/** How many distinct res-6 regions the player's cells fall in — their provinces. */
export function provinceCount(owned: readonly Cell[]): number {
  const regions = new Set<string>();
  for (const cell of owned) regions.add(regionOf(cell.h3));
  return regions.size;
}

/** A population figure from held ground and what stands on it. A gauge, not a resource. */
export function population(cellCount: number, buildingCount: number): number {
  return Math.max(0, cellCount) * POP_PER_CELL + Math.max(0, buildingCount) * POP_PER_BUILDING;
}
