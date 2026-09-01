/**
 * Area effects and loyalty (BRDC-BUILD-003).
 *
 * Until now a building changed only the cell it stood on, and the one thing that reached
 * further — the neighbour bonus to a claim — was invisible everywhere. This is the answer
 * to "a territory is more than the sum of its cells": some buildings project a resource
 * out to a radius, and Monuments and revealed places make the ground around them decay
 * slower.
 *
 * Pure. Overlaps sum to a per-cell ceiling (`AURA_CAP_PER_CELL`) so a dense cluster does
 * not run away, and loyalty is a multiplier on the decay `decay.ts` already computes —
 * one number, not a second clock.
 */
import { cellsWithin, neighboursOf } from '../geo/cells.js';
import { AURA_CAP_PER_CELL, DECAY_GRACE_HOURS, LOYALTY_MAX, LOYALTY_PER_SOURCE } from './constants.js';
import { BUILDINGS } from './build.js';
import type { AuraKind, Cell, H3Index } from '../types/domain.js';
import type { ResourceKind, ResourcePool } from './terrain.js';

export type { AuraKind } from '../types/domain.js';

const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

/**
 * Per-hour resource bonus from every awake aura building.
 *
 * `cells` is the ground the player holds — an aura only counts where it covers a held
 * cell, so anything outside the list is never credited. `sources` defaults to `cells`;
 * pass it separately only to measure a subset in isolation (the tests do). Each covered
 * cell accumulates from every source that reaches it, capped at `AURA_CAP_PER_CELL` per
 * resource, and the domain total is the sum of those capped cells. Dormancy-filtered on
 * the *source* — an aura from a cell nobody has walked in 48 h is dark.
 */
export function resourceAura(
  cells: readonly Cell[],
  now: number,
  sources: readonly Cell[] = cells,
): Partial<ResourcePool> {
  const held = new Set(cells.map((c) => c.h3));
  // h3 -> kind -> accumulated amount
  const perCell = new Map<H3Index, Partial<Record<AuraKind, number>>>();

  for (const source of sources) {
    if (!source.building) continue;
    if (now - source.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const aura = BUILDINGS[source.building.id].aura;
    if (!aura) continue;

    for (const h3 of cellsWithin(source.h3, aura.radius)) {
      if (!held.has(h3)) continue;
      const bucket = perCell.get(h3) ?? {};
      bucket[aura.kind] = Math.min(AURA_CAP_PER_CELL, (bucket[aura.kind] ?? 0) + aura.amount);
      perCell.set(h3, bucket);
    }
  }

  const total: Partial<ResourcePool> = {};
  for (const bucket of perCell.values()) {
    for (const [k, v] of Object.entries(bucket) as [ResourceKind, number][]) {
      total[k] = (total[k] ?? 0) + v;
    }
  }
  return total;
}

/**
 * The cells that lend loyalty: the player's own Monuments, and every revealed place.
 *
 * A place is loyal ground by its nature — you live there — and a Monument is the built
 * version of the same idea. `placeCells` comes from `getPlaces`; only the caller knows
 * which cells are the local player's, so this takes an already-owned set.
 */
export function loyaltySourceCells(
  ownedCells: readonly Cell[],
  placeCells: readonly H3Index[],
): Set<H3Index> {
  const sources = new Set<H3Index>(placeCells);
  for (const c of ownedCells) {
    if (c.building?.id === 'monument') sources.add(c.h3);
  }
  return sources;
}

/**
 * The decay multiplier for a cell: 1 with no loyalty, down to `1 - LOYALTY_MAX`.
 *
 * Counts loyalty sources adjacent to `h3` (not the cell itself — a Monument protects its
 * neighbours, and its own cell is already protected by standing on it). Fed to
 * `projectCell` and `sweepDecay`; a cell with no sources nearby is simply `1`.
 */
export function loyaltyFactor(h3: H3Index, sources: ReadonlySet<H3Index>): number {
  if (sources.size === 0) return 1;
  const adjacent = neighboursOf(h3).filter((n) => sources.has(n)).length;
  return 1 - Math.min(LOYALTY_MAX, adjacent * LOYALTY_PER_SOURCE);
}
