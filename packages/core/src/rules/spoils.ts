/**
 * What winning a Wager is worth.
 *
 * A duel that changes nothing is a demonstration, not a mechanic. But the reward cannot
 * be their ground — ground is taken by walking, and that rule is the spine of the whole
 * game. So a victory does the one thing that sits between those two: it *softens* their
 * border on your map. Their cells lose strength; you still have to go and stand on them.
 *
 * Three properties this has to have, and each is a test:
 *
 *   1. **It only ever touches imported ground.** Losing must not damage the territory
 *      you actually walked for, or a friend could grief you by challenging you nightly.
 *   2. **It never flips ownership.** A message cannot take a cell. Feet take cells.
 *   3. **It cannot be re-rolled.** The fight is deterministic, so importing the same
 *      message twice would give the same answer — but walking a little and importing it
 *      again would give a different one. A challenge is spent when it is fought.
 */
import { WAGER_SPOIL } from './constants.js';
import type { Cell, PlayerId } from '../types/domain.js';
import type { WagerOutcome } from './wagerBattle.js';

export interface Spoils {
  /** Cells left as they should now stand. Same length, same order, same owners. */
  cells: Cell[];
  /** How many of theirs were weakened. Drives the sentence the player reads. */
  weakened: number;
  /** Total strength taken off their border. */
  taken: number;
}

/**
 * Apply a Wager's result to the loser's ground on the winner's map.
 *
 * `me` is whoever is running this. When they lost, nothing happens at all — which is not
 * a missing branch but the point: the consequence of losing is that their border is
 * still exactly as hard to walk through as it was.
 */
export function applySpoils(
  cells: readonly Cell[],
  outcome: WagerOutcome,
  me: PlayerId,
): Spoils {
  if (outcome.winner !== me) return { cells: [...cells], weakened: 0, taken: 0 };

  let weakened = 0;
  let taken = 0;

  const next = cells.map((cell) => {
    if (cell.ownerId !== outcome.loser) return cell;

    // Floored at one, never at zero: a cell that hit zero here would be released by the
    // decay sweep, and that is ownership changing hands without anybody walking.
    const strength = Math.max(1, cell.strength - WAGER_SPOIL);
    if (strength === cell.strength) return cell;

    weakened += 1;
    taken += cell.strength - strength;
    return { ...cell, strength };
  });

  return { cells: next, weakened, taken };
}
