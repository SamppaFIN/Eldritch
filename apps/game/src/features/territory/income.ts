/**
 * What one hex actually pays an hour, and where each part of it comes from
 * (BRDC-DETAIL-002).
 *
 * The card used to show the terrain's own trickle and stop there, so a shoreline with a
 * fishing ground, a Fishery on it and Tide Lore researched read exactly like a bare
 * shoreline. Infinite asked for the arithmetic to be visible: *"että laskenta näkyy
 * selkeästi ja miksi"*.
 *
 * Composed from the rules rather than re-derived. `buildingBonus`, `researchBonus` and
 * `bountyBonus` all take a list of cells and sum per cell, so handing each one `[cell]`
 * gives that hex's own share and nothing else — the same functions the pouch settles
 * with, which is what keeps this line and the pouch from drifting apart.
 *
 * What it deliberately leaves out: auras, places, spells and trade routes. Those are
 * properties of a *realm* — a Monument two hexes away, a Rite running over everything —
 * and splitting them across cells would invent a number nobody could check. So this is
 * what the hex pays on its own, and it says so.
 */
import {
  TRICKLE_PER_HOUR,
  bountyBonus,
  buildingBonus,
  researchBonus,
  resourceForCell,
} from '@es3/core';
import type { Cell, H3Index, ResourceKind, ResourcePool, TechId } from '@es3/core';

export interface IncomePart {
  /** Where it comes from, in the player's words. */
  from: string;
  resource: ResourceKind;
  perHour: number;
}

export interface CellIncome {
  parts: IncomePart[];
  /** The sum, per resource — what the parts add up to. */
  total: Partial<ResourcePool>;
}

function add(into: Partial<ResourcePool>, from: Partial<ResourcePool>): void {
  for (const [k, v] of Object.entries(from) as [ResourceKind, number][]) {
    if (v > 0) into[k] = (into[k] ?? 0) + v;
  }
}

function partsOf(from: Partial<ResourcePool>, label: string): IncomePart[] {
  return (Object.entries(from) as [ResourceKind, number][])
    .filter(([, v]) => v > 0)
    .map(([resource, perHour]) => ({ from: label, resource, perHour }));
}

export function cellIncome(
  cell: Cell,
  revealed: Readonly<Record<H3Index, number>>,
  researched: readonly TechId[],
  now: number,
): CellIncome {
  const parts: IncomePart[] = [];
  const total: Partial<ResourcePool> = {};

  // The ground itself. Every producing cell trickles, which is the floor everything
  // else is added to.
  const terrain = resourceForCell(cell);
  if (terrain) {
    parts.push({ from: 'The ground', resource: terrain, perHour: TRICKLE_PER_HOUR });
    add(total, { [terrain]: TRICKLE_PER_HOUR });
  }

  const find = bountyBonus([cell], revealed, now);
  parts.push(...partsOf(find, 'What was found here'));
  add(total, find);

  const work = buildingBonus([cell], now);
  parts.push(...partsOf(work, 'The Work on it'));
  add(total, work);

  const study = researchBonus(researched, [cell], now);
  parts.push(...partsOf(study, 'Research'));
  add(total, study);

  return { parts, total };
}
