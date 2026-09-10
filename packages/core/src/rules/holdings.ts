/**
 * Every hex you hold, sorted by what it wants from you (BRDC-LANDS-001).
 *
 * The map answers "where am I". This answers "what have I got, and what needs me" — which
 * is a different question and, past a few dozen cells, one the map cannot answer at all.
 * Infinite holds three hundred and forty; scrolling a map to audit them is not a thing a
 * person does.
 *
 * Pure and clock-free apart from the `now` handed in, like every other rule here. The
 * order is the whole opinion of this module, so it is stated once and tested.
 */
import { hoursUntilReleased } from './decay.js';
import { resourceForCell, terrainForCell } from './terrain.js';
import type { ResourceKind, TerrainKind } from './terrain.js';
import { worksOn } from './build.js';
import { bountyOn } from './bounty.js';
import type { BountyId } from './bounty.js';
import type { BuildingId, Cell, H3Index } from '../types/domain.js';

export interface Holding {
  h3: H3Index;
  terrain: TerrainKind;
  /** What the ground yields, or null for plain. */
  resource: ResourceKind | null;
  strength: number;
  /** Whole hours before the Void takes it, or null for ground that cannot be lost. */
  hoursLeft: number | null;
  /** Distinct days walked while held — the loyalty base. */
  days: number;
  /** The Work standing on it, if any. One per hex (PIVOT-2026-09-09 §6). */
  work: BuildingId | null;
  /** What this particular hex has on it, once revealed (BRDC-BOUNTY-001). */
  bounty: BountyId | null;
  revealed: boolean;
  /** The Hearth cannot be lost and is listed first among the safe ones. */
  home: boolean;
}

/** `cell` is already decay-projected by `getOwnedCells`, so this needs no clock of its own. */
export function holdingOf(
  cell: Cell,
  revealed: Readonly<Record<H3Index, number>>,
  home: H3Index | null,
): Holding {
  const safe = cell.imported === true || cell.h3 === home;
  return {
    h3: cell.h3,
    terrain: terrainForCell(cell).kind,
    resource: resourceForCell(cell),
    strength: Math.round(cell.strength),
    hoursLeft: safe ? null : Math.round(hoursUntilReleased(cell.strength)),
    days: cell.ownedDays ?? 0,
    work: worksOn(cell)[0]?.id ?? null,
    // Only what has been looked for: an unrevealed hex must not spoil its own find.
    bounty: revealed[cell.h3] !== undefined ? bountyOn(cell) : null,
    revealed: revealed[cell.h3] !== undefined,
    home: cell.h3 === home,
  };
}

/**
 * The order, and why it is this order.
 *
 * **Unrevealed first**, because revealing is free, pays every time, and is the one thing
 * on this list a player can act on without walking anywhere — Infinite asked for exactly
 * this. Then whatever is closest to being lost, because that is the only other thing here
 * with a deadline. Ground that cannot be lost sinks to the bottom; it is doing fine.
 */
export function sortHoldings(list: readonly Holding[]): Holding[] {
  return [...list].sort((a, b) => {
    if (a.revealed !== b.revealed) return a.revealed ? 1 : -1;
    if (a.hoursLeft === null || b.hoursLeft === null) {
      if (a.hoursLeft === b.hoursLeft) return a.h3.localeCompare(b.h3);
      return a.hoursLeft === null ? 1 : -1;
    }
    if (a.hoursLeft !== b.hoursLeft) return a.hoursLeft - b.hoursLeft;
    return a.h3.localeCompare(b.h3);
  });
}

export interface HoldingsSummary {
  total: number;
  unrevealed: number;
  works: number;
  /** How many will be released inside a day, unless walked. */
  fading: number;
}

/** The counts a heading needs, so the list does not have to be read to be understood. */
export function summarise(list: readonly Holding[]): HoldingsSummary {
  return {
    total: list.length,
    unrevealed: list.filter((h) => !h.revealed).length,
    works: list.filter((h) => h.work !== null).length,
    fading: list.filter((h) => h.hoursLeft !== null && h.hoursLeft <= 24).length,
  };
}
