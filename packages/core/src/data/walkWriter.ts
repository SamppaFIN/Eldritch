/**
 * Writing a walk down.
 *
 * `walking.ts` decides what a batch of fixes means — it is pure, and it is where the
 * rules live. This is the half that touches the store: load the neighbourhood, run the
 * plan, write back the cells, the dwell and the seam between batches.
 *
 * Split out of MockRepository, which reached four hundred lines for the fourth time. The
 * rule is to split; this was the largest thing in it that was not really about being a
 * repository at all.
 */
import { K } from './keys.js';
import { planWalk, walkNeighbourhood } from './walking.js';
import { recordPaths } from './pathStore.js';
import { XP_PER_CELL_CLAIMED } from '../rules/constants.js';
import type { DwellMap, DwellReading } from '../rules/dwell.js';
import type { KeyValueStore } from './kv.js';
import type {
  CaptureOutcome,
  Cell,
  H3Index,
  PlayerId,
  RevealedPlace,
  TrailPoint,
} from '../types/domain.js';

export interface Walker {
  id: PlayerId;
  level: number;
  /** Whether they hold anything at all. The seed exception turns on this. */
  hasTerritory: boolean;
}

export interface WalkRecord {
  grown: CaptureOutcome[];
  xp: number;
  /** The part of TrailResult that a walk produces. */
  trail: {
    grown: CaptureOutcome[];
    revealed: RevealedPlace[];
    unobservedMs: number;
    outOfReach: number;
  };
}

/**
 * Resolve a batch of accepted fixes and persist everything it changed.
 *
 * Each fix grows the territory into the cell underfoot — if it touches ground already
 * held — and credits time to the cell just left. A cell that accumulates enough time
 * stops being ground and becomes a place.
 */
export async function recordWalk(
  store: KeyValueStore,
  accepted: readonly TrailPoint[],
  walker: Walker,
): Promise<WalkRecord> {
  /*
   * One batch, not one round-trip per cell (BRDC-GPX-004).
   *
   * This was a `for … await store.get` loop. Thirteen cells, and on a phone-sized
   * viewport it cost 7.8 s — about 600 ms per read, measured. Nothing is slow about the
   * data; what is slow is waiting for the main thread thirteen times while MapLibre is
   * drawing at 2.75× device pixels. `Promise.all` collapses thirteen scheduling waits
   * into one. Order does not matter here: these only populate `known` before planning.
   */
  const known = new Map<H3Index, Cell>();
  const ids = walkNeighbourhood(accepted);
  const loaded = await Promise.all(ids.map((h3) => store.get<Cell>(K.cell(h3))));
  ids.forEach((h3, i) => {
    const cell = loaded[i];
    if (cell) known.set(h3, cell);
  });

  const plan = planWalk(accepted, {
    attacker: { id: walker.id, level: walker.level },
    known,
    dwell: (await store.get<DwellMap>(K.dwell)) ?? {},
    previous: (await store.get<DwellReading | null>(K.lastReading)) ?? null,
    hasTerritory: walker.hasTerritory,
  });

  /*
   * The same, and one bug fewer.
   *
   * A walk that crosses a cell twice produced two steps for it, and the loop wrote both
   * — the second correctly overwriting the first, because it ran in order. Writing them
   * in parallel would have made that order a coin toss, so this keeps only the *last*
   * state per hex (a Map, insertion-ordered, later `set` wins) and writes those once.
   * Fewer writes, no ordering hazard, and the same result the loop was reaching for.
   */
  const finalCells = new Map<H3Index, Cell>();
  for (const step of plan.steps) if (step.cell) finalCells.set(step.cell.h3, step.cell);
  await Promise.all([...finalCells].map(([h3, cell]) => store.set(K.cell(h3), cell)));
  await store.set(K.dwell, plan.dwell);

  // The same batch wears the walked-path layer: every res-12 segment this trace crossed
  // gets a visit (BRDC-TRAIL-003). Kept apart from the cells above because a path is a
  // record of movement, not ground — it is never owned and never trimmed with a run.
  await recordPaths(store, accepted, (accepted[accepted.length - 1] as TrailPoint).t);

  // The seam between batches. Without it the gap between the last fix of one batch and
  // the first of the next is credited to nobody, and an hour of standing still vanishes.
  // The reading is on its effective cell — jitter held to the anchor (BRDC-DWELL-002) —
  // so a reload measures its first gap against where the player really was.
  if (plan.lastReading) {
    await store.set<DwellReading>(K.lastReading, plan.lastReading);
  }

  const grown = plan.steps.map((s) => s.outcome).filter((o): o is CaptureOutcome => o !== null);
  const taken = grown.filter((o) => o.kind === 'claimed' || o.kind === 'taken').length;

  return {
    grown,
    xp: taken * XP_PER_CELL_CLAIMED,
    trail: {
      grown,
      revealed: plan.revealed,
      unobservedMs: plan.unobservedMs,
      // Distinct hexes, not points: a track logging every second stands on the same
      // unreachable hex fifty times, and "50 out of reach" would be a lie about ground.
      outOfReach: new Set(
        plan.steps.filter((s) => s.skipped === 'not-adjacent').map((s) => s.h3),
      ).size,
    },
  };
}
