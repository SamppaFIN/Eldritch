/**
 * Turning a closed loop into territory.
 *
 * Kept out of MockRepository so the sequence stays a pure function of state in and
 * state out: detect, rasterise, resolve, price. The repository's job is to load and
 * store; deciding what happens is the rules' job, and SupabaseRepository will run the
 * SQL equivalent of exactly this in Phase 3.
 */
import { ringToCells } from '../geo/cells.js';
import { neighboursOf } from '../geo/cells.js';
import type { Loop } from '../geo/loopDetection.js';
import { emptyCell, resolveCapture } from '../rules/capture.js';
import type { Attacker } from '../rules/capture.js';
import {
  XP_PER_CELL_CLAIMED,
  XP_PER_CELL_REINFORCED,
  XP_PER_CELL_TAKEN,
} from '../rules/constants.js';
import type { CaptureOutcome, Cell, H3Index } from '../types/domain.js';

export interface ClaimPlan {
  /** Cells to write, already resolved. */
  cells: Cell[];
  outcomes: CaptureOutcome[];
  xp: number;
  areaM2: number;
}

/**
 * Resolve a loop against the cells it covers.
 *
 * `known` is the state before this loop — every cell the player might touch, plus their
 * neighbours. Neighbour bonuses are counted against that snapshot rather than against
 * cells claimed moments earlier in the same loop, so a single walk cannot bootstrap its
 * own siege strength as it goes.
 */
export function planClaim(
  loop: Loop,
  attacker: Omit<Attacker, 'ownedNeighbours'>,
  known: ReadonlyMap<H3Index, Cell>,
  now: number,
): ClaimPlan {
  const targets = ringToCells(loop.points);
  const cells: Cell[] = [];
  const outcomes: CaptureOutcome[] = [];
  let xp = 0;

  for (const h3 of targets) {
    const before = known.get(h3) ?? emptyCell(h3);
    const ownedNeighbours = neighboursOf(h3).filter(
      (n) => known.get(n)?.ownerId === attacker.id,
    ).length;

    const { cell, outcome } = resolveCapture(before, { ...attacker, ownedNeighbours }, now);
    cells.push(cell);
    outcomes.push(outcome);
    xp += xpFor(outcome);
  }

  return { cells, outcomes, xp, areaM2: loop.areaM2 };
}

function xpFor(outcome: CaptureOutcome): number {
  switch (outcome.kind) {
    case 'claimed':
      return XP_PER_CELL_CLAIMED;
    case 'taken':
      return XP_PER_CELL_TAKEN;
    case 'reinforced':
      return XP_PER_CELL_REINFORCED;
    default:
      // A cell already walked today, or one merely damaged, pays nothing. Otherwise
      // pacing back and forth over a rival's border would be an XP fountain.
      return 0;
  }
}

/** Every cell a claim could touch, including neighbours, so bonuses can be counted. */
export function cellsToLoad(loop: Loop): H3Index[] {
  const targets = ringToCells(loop.points);
  const needed = new Set<H3Index>(targets);
  for (const h3 of targets) {
    for (const neighbour of neighboursOf(h3)) needed.add(neighbour);
  }
  return [...needed];
}
