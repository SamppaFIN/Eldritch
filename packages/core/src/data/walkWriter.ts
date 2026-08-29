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
  trail: { grown: CaptureOutcome[]; revealed: RevealedPlace[]; unobservedMs: number };
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
  const known = new Map<H3Index, Cell>();
  for (const h3 of walkNeighbourhood(accepted)) {
    const stored = await store.get<Cell>(K.cell(h3));
    if (stored) known.set(h3, stored);
  }

  const plan = planWalk(accepted, {
    attacker: { id: walker.id, level: walker.level },
    known,
    dwell: (await store.get<DwellMap>(K.dwell)) ?? {},
    previous: (await store.get<DwellReading | null>(K.lastReading)) ?? null,
    hasTerritory: walker.hasTerritory,
  });

  for (const step of plan.steps) {
    if (step.cell) await store.set(K.cell(step.cell.h3), step.cell);
  }
  await store.set(K.dwell, plan.dwell);

  // The seam between batches. Without it the gap between the last fix of one batch and
  // the first of the next is credited to nobody, and an hour of standing still vanishes.
  const last = plan.steps[plan.steps.length - 1];
  if (last) {
    await store.set<DwellReading>(K.lastReading, {
      h3: last.h3,
      t: (accepted[accepted.length - 1] as TrailPoint).t,
    });
  }

  const grown = plan.steps.map((s) => s.outcome).filter((o): o is CaptureOutcome => o !== null);
  const taken = grown.filter((o) => o.kind === 'claimed' || o.kind === 'taken').length;

  return {
    grown,
    xp: taken * XP_PER_CELL_CLAIMED,
    trail: { grown, revealed: plan.revealed, unobservedMs: plan.unobservedMs },
  };
}
