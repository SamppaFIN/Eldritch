/**
 * Loop detection — the core mechanic.
 *
 * A walk becomes territory when it closes on itself. Getting this wrong in either
 * direction ruins the game: too eager and a player is handed land for walking to the
 * shop and back, too strict and a genuine lap around the block does nothing.
 *
 * The naive version — "is this fix near an earlier one" — fires the moment anyone turns
 * around, which is most walks. Proximity opens the question; enclosed area answers it.
 */
import {
  LOOP_CLOSE_RADIUS_M,
  MAX_LOOP_AREA_M2,
  MAX_LOOP_DURATION_MS,
  MIN_LOOP_AREA_M2,
  MIN_LOOP_POINTS,
} from '../rules/constants.js';
import type { TrailPoint } from '../types/domain.js';
import { polygonAreaM2 } from './area.js';
import { haversine } from './haversine.js';

export interface LoopOptions {
  /** Consciousness level. Raises the area ceiling by 10% per level. */
  level?: number;
  /** Overrides, for tests and for the dev time machine. */
  closeRadiusM?: number;
  minPoints?: number;
  maxDurationMs?: number;
}

export interface Loop {
  /** The closed ring, first point through the closing point. */
  points: TrailPoint[];
  areaM2: number;
  /** Index into the source trail where the ring begins. */
  startIndex: number;
  /** Index of the point that closed it. */
  endIndex: number;
  durationMs: number;
}

export type LoopRejection =
  | 'too-few-points'
  | 'no-closure'
  /** Ends where it started but encloses nothing — there and back again. */
  | 'no-area'
  | 'too-large'
  | 'too-slow';

export type LoopResult = { closed: true; loop: Loop } | { closed: false; reason: LoopRejection };

/** The area ceiling for a player, which grows as they do. */
export function maxLoopAreaM2(level = 1): number {
  return MAX_LOOP_AREA_M2 * (1 + Math.max(0, level) / 10);
}

/**
 * Does the trail's final point close a loop?
 *
 * This is the incremental form the game uses: one call per accepted fix, O(n) in the
 * trail so far. It looks for the *earliest* earlier point within the close radius,
 * because that is the largest ring the walker actually completed — a player who walks
 * a big lap should be given the big lap, not the last small kink in it.
 */
export function detectLoop(trail: readonly TrailPoint[], opts: LoopOptions = {}): LoopResult {
  const {
    level = 1,
    closeRadiusM = LOOP_CLOSE_RADIUS_M,
    minPoints = MIN_LOOP_POINTS,
    maxDurationMs = MAX_LOOP_DURATION_MS,
  } = opts;

  if (trail.length < minPoints) return { closed: false, reason: 'too-few-points' };

  const endIndex = trail.length - 1;
  const last = trail[endIndex] as TrailPoint;
  const ceiling = maxLoopAreaM2(level);

  // Candidates must be far enough back that the ring is a ring. Without this the
  // trail closes against the fix it just left, every single time.
  const newest = endIndex - (minPoints - 1);

  let sawClosure = false;
  let sawArea = false;
  let sawDuration = false;

  for (let start = 0; start <= newest; start++) {
    const candidate = trail[start] as TrailPoint;
    if (haversine(candidate, last) > closeRadiusM) continue;
    sawClosure = true;

    const points = trail.slice(start, endIndex + 1);
    const durationMs = last.t - candidate.t;
    if (durationMs > maxDurationMs) {
      sawDuration = true;
      continue;
    }

    const areaM2 = polygonAreaM2(points);
    if (areaM2 < MIN_LOOP_AREA_M2) {
      sawArea = true;
      continue;
    }
    if (areaM2 > ceiling) {
      // Too large is not a smaller loop's problem: a later start may still qualify.
      continue;
    }

    return { closed: true, loop: { points, areaM2, startIndex: start, endIndex, durationMs } };
  }

  if (!sawClosure) return { closed: false, reason: 'no-closure' };
  if (sawDuration) return { closed: false, reason: 'too-slow' };
  if (sawArea) return { closed: false, reason: 'no-area' };
  return { closed: false, reason: 'too-large' };
}

/**
 * Every loop in a completed trail, in order.
 *
 * Used by the fixtures and by anything replaying a recorded walk. Once a ring closes,
 * its points are consumed: a figure-eight is two loops, not one loop counted twice and
 * not a single ring with a pinch in the middle.
 */
export function detectLoops(trail: readonly TrailPoint[], opts: LoopOptions = {}): Loop[] {
  const loops: Loop[] = [];
  let offset = 0;

  while (offset < trail.length) {
    const remaining = trail.slice(offset);
    let found: Loop | null = null;

    // Grow the window a point at a time, exactly as the live game sees it arrive.
    for (let end = (opts.minPoints ?? MIN_LOOP_POINTS); end <= remaining.length; end++) {
      const result = detectLoop(remaining.slice(0, end), opts);
      if (result.closed) {
        found = result.loop;
        break;
      }
    }

    if (!found) break;

    loops.push({
      ...found,
      startIndex: found.startIndex + offset,
      endIndex: found.endIndex + offset,
    });
    offset += found.endIndex + 1;
  }

  return loops;
}
