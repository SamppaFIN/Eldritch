/**
 * The Void reclaims.
 *
 * Territory that nobody walks fades and is eventually released. Without it the map
 * jams: with two players, everything either of them has ever walked stays theirs, and
 * within a fortnight there is nothing left to play for.
 *
 * Decay accelerates. Two days' grace, then a slow bleed, then a fast one after a
 * fortnight. A cell at full strength survives about 33 days untouched; a freshly claimed
 * one about 12. Those two numbers are the whole shape of the game's tempo.
 *
 * Applied at read time rather than by a timer. There is no background process in a
 * static site, and in Phase 3 the same arithmetic runs in SQL — a scheduled job would
 * put the two out of step, and the golden-fixture tests would be right to fail.
 */
import type { Cell } from '../types/domain.js';
import {
  DECAY_GRACE_HOURS,
  DECAY_LATE_AFTER_DAYS,
  DECAY_PER_DAY,
  DECAY_PER_DAY_LATE,
} from './constants.js';

/**
 * The cell as it stands at `now`, or `null` if the Void has taken it.
 *
 * **This is a projection, not a new state. Never write the result back.**
 *
 * Decay is always measured from the true last visit, so projecting a projection charges
 * for the same days twice — and advancing `lastVisitedAt` instead would be worse, since
 * it hands out a fresh 48-hour grace period on every read and a cell that is looked at
 * often enough would never decay at all.
 *
 * Stored state changes on exactly two events: a visit (which sets both strength and
 * `lastVisitedAt`) and a release (which frees the cell). Everything in between is
 * arithmetic done at read time. `projectCell` is named for what it does so that
 * "apply and save" does not read like the obvious thing to do.
 *
 * Returning `null` rather than a floor is deliberate: a cell at zero strength is not a
 * very weak cell, it is unowned ground again, and a caller that treats it as still-held
 * would keep a ghost on the map forever.
 */
export function projectCell(cell: Cell, now: number): Cell | null {
  if (cell.ownerId === null) return cell;

  const hours = (now - cell.lastVisitedAt) / 3_600_000;
  if (hours <= DECAY_GRACE_HOURS) return cell;

  const strength = cell.strength - decayAmount(hours);
  if (strength <= 0) return null;

  // lastVisitedAt is untouched, which is what keeps the projection honest.
  return { ...cell, strength };
}

/** Strength lost after `hours` without a visit. */
export function decayAmount(hours: number): number {
  const past = hours - DECAY_GRACE_HOURS;
  if (past <= 0) return 0;

  const days = past / 24;
  const late = Math.max(0, days - DECAY_LATE_AFTER_DAYS);
  const early = days - late;

  return early * DECAY_PER_DAY + late * DECAY_PER_DAY_LATE;
}

/**
 * How long a cell at `strength` has left, in hours from its last visit.
 *
 * Used by the HUD to warn before a cell is lost. A player who only finds out after the
 * fact does not come back; one who is told on Thursday that Saturday's route is fading
 * goes for a walk.
 */
export function hoursUntilReleased(strength: number): number {
  if (strength <= 0) return 0;

  const earlyCapacity = DECAY_LATE_AFTER_DAYS * DECAY_PER_DAY;
  const days =
    strength <= earlyCapacity
      ? strength / DECAY_PER_DAY
      : DECAY_LATE_AFTER_DAYS + (strength - earlyCapacity) / DECAY_PER_DAY_LATE;

  return DECAY_GRACE_HOURS + days * 24;
}

export interface DecaySweep {
  cells: Cell[];
  weakened: string[];
  released: string[];
}

/**
 * Project a whole set, keeping what survives and naming what did not.
 *
 * The returned cells are projections, for rendering. The only thing worth persisting
 * from a sweep is `released` — those cells are genuinely gone.
 */
export function sweepDecay(cells: readonly Cell[], now: number): DecaySweep {
  const kept: Cell[] = [];
  const weakened: string[] = [];
  const released: string[] = [];

  for (const cell of cells) {
    const after = projectCell(cell, now);
    if (after === null) {
      released.push(cell.h3);
      continue;
    }
    if (after.strength < cell.strength) weakened.push(cell.h3);
    kept.push(after);
  }

  return { cells: kept, weakened, released };
}
