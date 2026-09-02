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
import { DWELL_JITTER_GAP_MS, OBSERVATION_GAP_MS } from '../rules/constants.js';
import type { Attacker } from '../rules/capture.js';
import { accrueDwell, dwellAnchorAt, revealPlaces, stickyDwell } from '../rules/dwell.js';
import type { DwellAnchor, DwellMap, DwellReading, Place } from '../rules/dwell.js';
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
  /**
   * The last dwell reading, on its *effective* cell — jitter held to the anchor
   * (BRDC-DWELL-002). The caller persists this as the seam, so a reload's first batch
   * measures its gap against where the player really was, not a noisy last fix.
   */
  lastReading: DwellReading | null;
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
  // The sticky dwell anchor (BRDC-DWELL-002) — where the player's time is really going,
  // held against a fix that flips to a neighbouring hex.
  let anchor: DwellAnchor | null = context.previous ? dwellAnchorAt(context.previous.h3) : null;

  const before = new Set(revealPlaces(dwell).map((p) => `${p.h3}:${p.kind}`));

  let unobservedMs = 0;

  for (const point of points) {
    const raw = cellAt(point);

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

    // Dense fixes and no resume gap = the player has not had time to walk a cell, so a
    // flip to a neighbour is jitter. Growth and `steps[].h3` keep the raw cell; only the
    // dwell reading is settled onto the anchor.
    const stationary = !resumed && gap > 0 && gap <= DWELL_JITTER_GAP_MS;
    if (!anchor) anchor = dwellAnchorAt(raw);
    const settled = stickyDwell(anchor, raw, point.t, stationary);
    anchor = settled.anchor;
    const reading: DwellReading = { h3: settled.cell, t: point.t };

    dwell = accrueDwell(dwell, previous, reading);
    previous = reading;

    const grown = growInto(raw, known, attacker, point.t, hasTerritory && !resumed);
    if (grown.cell) {
      known.set(raw, grown.cell);
      if (grown.cell.ownerId === attacker.id) hasTerritory = true;
    }

    steps.push({ h3: raw, cell: grown.cell, outcome: grown.outcome, skipped: grown.skipped, resumed });
  }

  const places = revealPlaces(dwell);
  return {
    steps,
    dwell,
    places,
    unobservedMs,
    lastReading: previous,
    // Only what is new. A place already revealed is not news every ten seconds.
    revealed: places.filter((p) => !before.has(`${p.h3}:${p.kind}`)),
  };
}
