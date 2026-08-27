/**
 * What a walk does, beyond drawing a line.
 *
 * Every accepted fix does three things now: it grows the territory into the cell under
 * the player's feet, it credits time to the cell they just left, and it may push a cell
 * over the threshold where it stops being ground and becomes a place.
 *
 * Kept out of MockRepository so the sequence stays a pure function of state in and state
 * out, and so the same steps can be replayed against a recorded walk.
 */
import { cellAt } from '../geo/cells.js';
import { OBSERVATION_GAP_MS } from '../rules/constants.js';
import type { Attacker } from '../rules/capture.js';
import { accrueDwell, revealPlaces } from '../rules/dwell.js';
import type { DwellMap, DwellReading, Place } from '../rules/dwell.js';
import { growInto, growthNeighbourhood } from '../rules/growth.js';
import type { CaptureOutcome, Cell, H3Index, TrailPoint } from '../types/domain.js';

export interface WalkStep {
  /** The cell the player is standing in. */
  h3: H3Index;
  cell: Cell | null;
  outcome: CaptureOutcome | null;
  skipped: 'not-adjacent' | null;
  /** True when this point arrived after the game had stopped receiving fixes. */
  resumed: boolean;
}

export interface WalkPlan {
  steps: WalkStep[];
  dwell: DwellMap;
  /** Places that crossed a threshold during this batch, and so are news. */
  revealed: Place[];
  places: Place[];
  /** Total time this batch spent with the page asleep. Nothing was observed in it. */
  unobservedMs: number;
}

export interface WalkContext {
  attacker: Attacker;
  /** Cells the caller has loaded: every cell walked through, plus their neighbours. */
  known: Map<H3Index, Cell>;
  dwell: DwellMap;
  /** The last reading of the previous batch, so time is not lost at the seam. */
  previous: DwellReading | null;
  hasTerritory: boolean;
}

/** Every cell a batch of points could touch. The caller loads these before planning. */
export function walkNeighbourhood(points: readonly TrailPoint[]): H3Index[] {
  const needed = new Set<H3Index>();
  for (const point of points) {
    for (const h3 of growthNeighbourhood(cellAt(point))) needed.add(h3);
  }
  return [...needed];
}

/**
 * Resolve a batch of accepted points.
 *
 * `known` is mutated as it goes, deliberately: a walk that crosses the same cell twice
 * must see its own first pass, or the second would claim it all over again. The caller
 * owns the map and writes it back.
 */
export function planWalk(points: readonly TrailPoint[], context: WalkContext): WalkPlan {
  const { attacker, known } = context;
  const steps: WalkStep[] = [];

  let dwell = context.dwell;
  let previous = context.previous;
  let hasTerritory = context.hasTerritory;

  const before = new Set(revealPlaces(dwell).map((p) => `${p.h3}:${p.kind}`));

  let unobservedMs = 0;

  for (const point of points) {
    const h3 = cellAt(point);
    const reading: DwellReading = { h3, t: point.t };

    /*
     * A silence long enough to mean the page was frozen.
     *
     * The player kept walking through it; the game simply was not there to see. So the
     * next fix is allowed to stand on its own rather than being rejected as a jump —
     * otherwise one pocketed phone ends territory growth for the rest of the walk.
     */
    const gap = previous ? point.t - previous.t : 0;
    const resumed = gap >= OBSERVATION_GAP_MS;
    if (resumed) unobservedMs += gap;

    dwell = accrueDwell(dwell, previous, reading);
    previous = reading;

    const grown = growInto(h3, known, attacker, point.t, hasTerritory && !resumed);
    if (grown.cell) {
      known.set(h3, grown.cell);
      if (grown.cell.ownerId === attacker.id) hasTerritory = true;
    }

    steps.push({ h3, cell: grown.cell, outcome: grown.outcome, skipped: grown.skipped, resumed });
  }

  const places = revealPlaces(dwell);
  return {
    steps,
    dwell,
    places,
    unobservedMs,
    // Only what is new. A place already revealed is not news every ten seconds.
    revealed: places.filter((p) => !before.has(`${p.h3}:${p.kind}`)),
  };
}
