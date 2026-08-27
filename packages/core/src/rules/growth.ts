/**
 * Territory that grows with your feet.
 *
 * Closing a loop takes the ground inside it. This takes the ground you are standing on —
 * but only if it touches what you already hold. Two layers of the same mechanic: the
 * walk grows a worm, the loop fills a shape.
 *
 * The adjacency rule is also the anti-jump guard, and a better one than a speed filter.
 * A fix that lands 200 m sideways does not touch your territory, so it claims nothing;
 * when the signal recovers, growth carries on from where it really was. No polygon test,
 * no special case, nothing to tune.
 */
import { neighboursOf } from '../geo/cells.js';
import { emptyCell, resolveCapture } from './capture.js';
import type { Attacker } from './capture.js';
import type { CaptureOutcome, Cell, H3Index } from '../types/domain.js';

export interface GrowthResult {
  cell: Cell | null;
  outcome: CaptureOutcome | null;
  /** Why nothing happened, when nothing happened. */
  skipped: 'not-adjacent' | null;
}

/**
 * Resolve the player standing on one cell.
 *
 * `known` is every cell that matters: the target and its six neighbours. The caller
 * loads them; this decides.
 *
 * `requireAdjacency` is false for a claim that is allowed to stand alone: the first cell
 * a player ever takes, and the first after the game lost sight of them for minutes at a
 * time. Everything else must touch ground they already hold.
 */
export function growInto(
  h3: H3Index,
  known: ReadonlyMap<H3Index, Cell>,
  attacker: Attacker,
  now: number,
  requireAdjacency: boolean,
): GrowthResult {
  const current = known.get(h3);

  // Already ours: still a visit, and the day bonus and decay clock both care.
  if (current?.ownerId === attacker.id) {
    const { cell, outcome } = resolveCapture(current, attacker, now);
    return { cell, outcome, skipped: null };
  }

  const neighbours = neighboursOf(h3);
  const ownedNeighbours = neighbours.filter((n) => known.get(n)?.ownerId === attacker.id).length;

  /*
   * The seed exception, and the reason it is safe.
   *
   * A player with no ground has to start somewhere, so the first cell is taken wherever
   * they stand. After that every claim must touch what they hold — which means a bad
   * fix cannot found a second colony halfway across town.
   */
  if (requireAdjacency && ownedNeighbours === 0) {
    return { cell: null, outcome: null, skipped: 'not-adjacent' };
  }

  const { cell, outcome } = resolveCapture(current ?? emptyCell(h3), { ...attacker, ownedNeighbours }, now);
  return { cell, outcome, skipped: null };
}

/** Every cell a growth step needs loaded: where you stand, and what surrounds it. */
export function growthNeighbourhood(h3: H3Index): H3Index[] {
  return [h3, ...neighboursOf(h3)];
}
