/**
 * How long it actually takes to take somebody's ground (BRDC-CLAIM-016).
 *
 * `claude.md` §11 makes a promise about the siege numbers: *"Taking someone's established
 * home block should require two or three separate walks on separate days."* Every constant
 * behind that sentence came across from v2 and none of them has been measured in this
 * game. The ticket's own rule is that no constant moves without a run first — they are
 * balanced against each other, and `NEIGHBOUR_BONUS` sits on both sides of the fight.
 *
 * So this is the run. It is deliberately a *simulation over the real rules* rather than
 * arithmetic on the constants: `resolveCapture` and `projectCell` are called exactly as
 * the live path calls them, so the answer cannot drift from the game the way a
 * spreadsheet would.
 *
 * Pure, and in `sim` beside `walk.ts`, because it invents no rules of its own.
 */
import { resolveCapture } from '../rules/capture.js';
import { projectCell } from '../rules/decay.js';
import { emptyCell } from '../rules/capture.js';
import type { Cell } from '../types/domain.js';

const ATTACKER = 'besieger';
const DEFENDER = 'holder';
const CELL = '8b088a2dab1cfff';
const DAY_MS = 86_400_000;

export interface SiegeSetup {
  /** Where the defended cell starts. An established block sits at or near MAX_STRENGTH. */
  defenderStrength: number;
  attackerLevel: number;
  /** Own ground touching the target — the besieger's side of NEIGHBOUR_BONUS. */
  attackerNeighbours: number;
  /** An Anchor Stone backing the attack (ANCHOR_BONUS). */
  anchored?: boolean;
  /** A Fortress aura over the cell, subtracted from every blow. */
  defence?: number;
  /** Does the holder walk their own ground between the attacker's visits? */
  defenderHolds?: boolean;
}

export interface SiegeResult {
  /** Separate-day walks until the cell changes hands. `null` if it never does. */
  walks: number | null;
  /** Damage one pass lands, before the defender's answer. */
  perWalk: number;
  /** Strength after each attacking walk, for reading what the siege felt like. */
  trace: number[];
}

/**
 * Walk the attacker onto the cell once a day until it falls.
 *
 * One walk per day is the honest unit: `resolveCapture` gives a defender their
 * reinforcement only on a *new* day, and the promise in §11 is counted in separate walks
 * rather than in laps of the same block.
 */
export function walksToTake(setup: SiegeSetup, cap = 40): SiegeResult {
  const {
    defenderStrength,
    attackerLevel,
    attackerNeighbours,
    anchored = false,
    defence = 0,
    defenderHolds = false,
  } = setup;

  let cell: Cell = {
    ...emptyCell(CELL),
    ownerId: DEFENDER,
    strength: defenderStrength,
    lastVisitedAt: 0,
    visitDays: [],
  };

  const attacker = {
    id: ATTACKER,
    level: attackerLevel,
    ownedNeighbours: attackerNeighbours,
    anchored,
  };

  const trace: number[] = [];
  let perWalk = 0;

  for (let day = 1; day <= cap; day += 1) {
    const now = day * DAY_MS;

    /*
     * The defender's own day comes first. A holder who is still walking their block
     * reinforces before the attacker arrives, which is the realistic order — and it is
     * the difference between a siege and a formality.
     */
    if (defenderHolds) {
      cell = resolveCapture(cell, { id: DEFENDER, level: attackerLevel }, now).cell;
    } else {
      // Nobody has been here, so the cell is ageing. The real rule, not a subtraction.
      const aged = projectCell(cell, now, 1, null);
      if (aged === null) return { walks: day, perWalk, trace };
      cell = aged;
    }

    const before = cell.strength;
    const { cell: after, outcome } = resolveCapture(cell, attacker, now, defence);
    cell = after;
    // Only a blow that lands on a standing cell measures anything: on the walk that
    // flips it, `strengthAfter` is the attacker's own fresh BASE_STRENGTH, and
    // subtracting that reports nonsense.
    if (outcome.kind === 'damaged') perWalk = before - outcome.strengthAfter;
    trace.push(outcome.strengthAfter);

    if (outcome.kind === 'taken') return { walks: day, perWalk, trace };
  }

  return { walks: null, perWalk, trace };
}
