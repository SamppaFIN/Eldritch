/**
 * The state of a sanctuary, in numbers a player can act on.
 *
 * The HUD answers "how am I doing right now" in four figures while walking. This answers
 * "what have I built" — read standing still, from the Hearth, which is the one cell on
 * the map that is about the whole of it rather than about itself.
 *
 * Pure, so the arithmetic can be checked without a browser: several of these are easy to
 * get subtly wrong (a rate that counts cells producing nothing, a "weakest" that picks a
 * cell already released) and wrong numbers here would be read as the game lying.
 */
import { TRICKLE_PER_HOUR, cellAreaM2, hoursUntilReleased, resourceOf } from '@es3/core';
import type { Cell, ResourceKind } from '@es3/core';

export interface Dominion {
  cells: number;
  areaM2: number;
  strongest: number;
  /** The cell closest to being lost, or null when nothing is held. */
  weakest: Cell | null;
  /** Hours until the first cell is released, or null if none is close. */
  firstLossInHours: number | null;
  /** Cells within a day of being taken by the Void. */
  atRisk: number;
  /** How many held cells produce each resource. */
  producing: Record<ResourceKind, number>;
  /** What the whole territory yields per hour, by resource. */
  perHour: Record<ResourceKind, number>;
}

const NONE: Record<ResourceKind, number> = { water: 0, wood: 0, gold: 0 };

/** A day is the horizon a walk can answer. Anything further off is not yet a decision. */
const AT_RISK_HOURS = 24;

export function dominionOf(owned: readonly Cell[], now: number): Dominion {
  const producing = { ...NONE };
  let areaM2 = 0;
  let strongest = 0;
  let weakest: Cell | null = null;
  let firstLossInHours: number | null = null;
  let atRisk = 0;

  for (const cell of owned) {
    areaM2 += cellAreaM2(cell.h3);
    strongest = Math.max(strongest, cell.strength);

    const resource = resourceOf(cell.h3);
    if (resource) producing[resource] += 1;

    // Hours left is measured from the last visit, not from full strength: the span a
    // strength buys has to have the time already spent decaying taken off it.
    const left = hoursUntilReleased(cell.strength) - (now - cell.lastVisitedAt) / 3_600_000;
    if (left <= AT_RISK_HOURS) atRisk += 1;
    if (firstLossInHours === null || left < firstLossInHours) {
      firstLossInHours = left;
      weakest = cell;
    }
  }

  return {
    cells: owned.length,
    areaM2,
    strongest,
    weakest,
    firstLossInHours,
    atRisk,
    producing,
    perHour: {
      water: producing.water * TRICKLE_PER_HOUR,
      wood: producing.wood * TRICKLE_PER_HOUR,
      gold: producing.gold * TRICKLE_PER_HOUR,
    },
  };
}
