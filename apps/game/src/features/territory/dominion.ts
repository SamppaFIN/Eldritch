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
import {
  DECAY_GRACE_HOURS,
  RESOURCE_KINDS,
  TRICKLE_PER_HOUR,
  cellAreaM2,
  hoursUntilReleased,
  resourceOf,
} from '@es3/core';
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
  /** How many held cells produce each resource, counting only ones currently awake. */
  producing: Record<ResourceKind, number>;
  /**
   * Producing-terrain cells that are dormant right now — not visited within the grace
   * window (BRDC-ECON-001). Kept separate from `producing` rather than folded into it:
   * a cell that yields nothing because it is resting is a different fact from a cell
   * that yields nothing because it is plain ground, and conflating them would make the
   * rate a lie the moment a player stops walking one street for a couple of days.
   */
  resting: number;
  /** What the whole territory yields per hour, by resource. */
  perHour: Record<ResourceKind, number>;
}

const NONE = Object.fromEntries(RESOURCE_KINDS.map((k) => [k, 0])) as Record<ResourceKind, number>;

/** A day is the horizon a walk can answer. Anything further off is not yet a decision. */
const AT_RISK_HOURS = 24;

const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

export function dominionOf(owned: readonly Cell[], now: number): Dominion {
  const producing = { ...NONE };
  let resting = 0;
  let areaM2 = 0;
  let strongest = 0;
  let weakest: Cell | null = null;
  let firstLossInHours: number | null = null;
  let atRisk = 0;

  for (const cell of owned) {
    areaM2 += cellAreaM2(cell.h3);
    strongest = Math.max(strongest, cell.strength);

    const resource = resourceOf(cell.h3);
    if (resource) {
      if (now - cell.lastVisitedAt <= DORMANT_AFTER_MS) producing[resource] += 1;
      else resting += 1;
    }

    // Hours left is measured from the last visit, not from full strength: the span a
    // strength buys has to have the time already spent decaying taken off it.
    const left = hoursUntilReleased(cell.strength) - (now - cell.lastVisitedAt) / 3_600_000;
    if (left <= AT_RISK_HOURS) atRisk += 1;
    if (firstLossInHours === null || left < firstLossInHours) {
      firstLossInHours = left;
      weakest = cell;
    }
  }

  const perHour = Object.fromEntries(
    RESOURCE_KINDS.map((k) => [k, producing[k] * TRICKLE_PER_HOUR]),
  ) as Record<ResourceKind, number>;

  return {
    cells: owned.length,
    areaM2,
    strongest,
    weakest,
    firstLossInHours,
    atRisk,
    producing,
    resting,
    perHour,
  };
}
