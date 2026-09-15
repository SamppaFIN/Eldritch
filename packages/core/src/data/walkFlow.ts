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
import { FORTRESS_REACH, fortified } from '../rules/aura.js';
import { cellsWithin } from '../geo/cells.js';
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
  const lastT = (accepted[accepted.length - 1] as TrailPoint).t;

  /*
   * One read of the player's ground, used twice (BRDC-GPX-004).
   *
   * This ran two separate full scans of the cell store per batch: `hasGround`, to decide
   * whether growth may seed, and `getOwnedCells`, to settle the pouch. Each one reads and
   * parses every stored cell, and a live trail submits while an import is still running,
   * so the phone paid for four. `getOwnedCells` already answers both questions.
   *
   * Reading it *before* the walk is recorded is deliberate, not merely convenient: the
   * settle pays the hourly trickle for ground held over the interval, and cells taken by
   * this very batch were not held for any of it. The seed test is also better for it —
   * `getOwnedCells` ages its cells first, so a player whose last hex rotted away this
   * morning now correctly reads as landless, where `hasGround` would have found the
   * unswept row and refused them a seed.
   */
  const owned = await d.getOwnedCells(lastT);

  const walked = await recordWalk(d.store, accepted, {
    id: profile.id,
    level: profile.level,
    hasTerritory: owned.length > 0,
  });

  if (walked.xp > 0) await d.addXp(walked.xp);
  await awardClaims(d.store, owned, walked.grown, lastT);

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
  const targets = cellsToLoad(detected.loop);
  /*
   * Read one Fortress-reach past everything the claim touches (BRDC-BUILD-012). The aging
   * below *deletes* what decay released, and whether a hex stands under a Fortress
   * depends on the ring around it — which, for the outer cells here, lies beyond
   * `targets`. Deciding from less would delete ground a Fortress promised to keep.
   */
  const lookupH3 = [...new Set(targets.flatMap((h3) => cellsWithin(h3, FORTRESS_REACH)))];
  const found = await d.store.getMany<Cell>(lookupH3.map((h3) => K.cell(h3)));
  const lookup = new Map<string, Cell>();
  lookupH3.forEach((h3, i) => {
    const cell = found[i];
    if (cell) lookup.set(h3, cell);
  });

  const known = new Map<string, Cell>();
  for (const h3 of targets) {
    const stored = lookup.get(h3);
    // Aged first: besieging a cell that has already rotted away should find
    // empty ground, not a defender who stopped existing last week. The Hearth is
    // exempt — a loop that clips it must never be what deletes it (BRDC-HEARTH-002).
    if (stored) {
      // …and so is ground under a Fortress, which does not decay at all.
      const [alive] = sweepDecay([stored], now, undefined, home, (c) => fortified(lookup, c.h3)).cells;
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
