/**
 * Resolving a walk: taking a batch of points, and closing the loop it may have drawn.
 *
 * Lifted out of MockRepository when that file reached its four hundred lines — the same
 * split `pouch.js`, `techStore.js` and `buildStore.js` already are. It is a coherent
 * seam: everything here is what happens to a run's points, and the repository only has to
 * hand over the few things it owns (the store, the profile, the owned cells, XP) through
 * `WalkDeps`. The bodies are unchanged from the methods they were.
 */
import { filterTrail } from '../geo/filter.js';
import { detectLoop } from '../geo/loopDetection.js';
import { sweepDecay } from '../rules/decay.js';
import { hasGround } from './cellStore.js';
import { awardClaims } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { recordWalk } from './walkWriter.js';
import { cellsToLoad, planClaim } from './claiming.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, ClaimResult, PlayerProfile, Run, RunId, TrailPoint } from '../types/index.js';

/**
 * What loop resolution needs from the repository.
 *
 * `seed` is the still-private `ensureSeeded` closed over — the world is built lazily on
 * the first accepted point, and that is the repository's own concern to keep private.
 */
export interface WalkDeps {
  store: KeyValueStore;
  getTrailPoints(runId: RunId): Promise<TrailPoint[]>;
  getProfile(): Promise<PlayerProfile>;
  getOwnedCells(now: number): Promise<Cell[]>;
  addXp(amount: number): Promise<unknown>;
  seed(origin: TrailPoint): Promise<void>;
}

export async function submitWalk(d: WalkDeps, runId: RunId, points: TrailPoint[]) {
  const run = await d.store.get<Run>(K.run(runId));
  if (!run) throw new Error(`Unknown run: ${runId}`);

  const existing = await d.getTrailPoints(runId);
  const previous = existing.length > 0 ? (existing[existing.length - 1] as TrailPoint) : null;

  // Validation happens here, not in the caller. A repository that trusts its input
  // is exactly what v2's position:update handler was.
  const { accepted, result } = filterTrail(previous, points);
  if (accepted.length === 0) return result;

  await d.store.set(K.trail(runId), [...existing, ...accepted]);
  await d.store.set(K.run(runId), {
    ...run,
    pointCount: run.pointCount + accepted.length,
    distanceM: run.distanceM + result.distanceM,
  });
  await d.seed(accepted[0] as TrailPoint);

  const profile = await d.getProfile();
  const walked = await recordWalk(d.store, accepted, {
    id: profile.id,
    level: profile.level,
    hasTerritory: await hasGround(d.store, profile.id),
  });

  if (walked.xp > 0) await d.addXp(walked.xp);
  const lastT = (accepted[accepted.length - 1] as TrailPoint).t;
  await awardClaims(d.store, await d.getOwnedCells(lastT), walked.grown, lastT);

  return { ...result, ...walked.trail };
}

/**
 * Close the run's loop, if it has one, and take what it encloses.
 *
 * Loads the cells the ring covers *and their neighbours*, so siege bonuses are
 * counted against the ground held before this walk rather than against cells claimed
 * moments earlier in the same lap.
 */
export async function closeWalk(d: WalkDeps, runId: RunId, now: number): Promise<ClaimResult> {
  const points = await d.getTrailPoints(runId);
  const profile = await d.getProfile();

  const detected = detectLoop(points, { level: profile.level });
  if (!detected.closed) return { closed: false };

  const home = (await d.store.get<string>(K.home)) ?? null;
  const known = new Map<string, Cell>();
  for (const h3 of cellsToLoad(detected.loop)) {
    const stored = await d.store.get<Cell>(K.cell(h3));
    // Aged first: besieging a cell that has already rotted away should find
    // empty ground, not a defender who stopped existing last week. The Hearth is
    // exempt — a loop that clips it must never be what deletes it (BRDC-HEARTH-002).
    if (stored) {
      const [alive] = sweepDecay([stored], now, undefined, home).cells;
      if (alive) known.set(h3, alive);
      else await d.store.delete(K.cell(h3));
    }
  }

  const plan = planClaim(detected.loop, { id: profile.id, level: profile.level }, known, now);
  for (const cell of plan.cells) await d.store.set(K.cell(cell.h3), cell);
  if (plan.xp > 0) await d.addXp(plan.xp);
  await awardClaims(d.store, await d.getOwnedCells(now), plan.outcomes, now);

  // One log line per kind of thing this lap did (BRDC-LOG-001).
  const tally = (kind: string) => plan.outcomes.filter((o) => o.kind === kind).length;
  for (const [kind, count] of [
    ['awaken', tally('claimed')],
    ['corrupt', tally('taken')],
    ['reinforce', tally('reinforced')],
  ] as const) {
    if (count > 0) await writeLogEntry(d.store, { at: now, kind, count });
  }

  // The ring is spent. Keeping it would let the next fix close the same loop again.
  await d.store.set(K.trail(runId), points.slice(detected.loop.endIndex));

  return { closed: true, outcomes: plan.outcomes, areaM2: plan.areaM2 };
}
