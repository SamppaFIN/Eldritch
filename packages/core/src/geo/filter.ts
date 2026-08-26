/**
 * GPS point validation.
 *
 * The client cannot be trusted and neither can the phone: a city street corner reports
 * 40 m accuracy and the occasional 200 m jump, and a mock-location app reports whatever
 * it likes. v2 took positions as given and wrote them straight into state.
 *
 * Every rejection carries a reason. The HUD shows it, so a player standing under a
 * balcony learns that the sky is the problem rather than concluding the game is broken.
 * From Phase 3 the same reasons are recorded server-side.
 */
import {
  CONSOLIDATE_RADIUS_M,
  MAX_ACCURACY_M,
  MAX_SPEED_MS,
  MIN_POINT_INTERVAL_MS,
} from '../rules/constants.js';
import type { RejectReason, TrailPoint, TrailResult } from '../types/domain.js';
import { haversine } from './haversine.js';

export type Accept = { ok: true } | { ok: false; reason: RejectReason };

const OK: Accept = { ok: true };

/**
 * Decide whether `next` may join the trail after `prev`.
 *
 * Order matters. Accuracy is checked before anything derived from position, because a
 * 200 m-accurate point produces a meaningless distance and would otherwise be rejected
 * as "speed" — a true verdict for the wrong reason, and a misleading one in the HUD.
 */
export function acceptPoint(prev: TrailPoint | null, next: TrailPoint): Accept {
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) {
    return { ok: false, reason: 'accuracy' };
  }
  if (next.accuracy > MAX_ACCURACY_M) return { ok: false, reason: 'accuracy' };

  // The first fix of a run has nothing to compare against.
  if (prev === null) return OK;

  const dt = next.t - prev.t;
  if (dt < MIN_POINT_INTERVAL_MS) return { ok: false, reason: 'interval' };

  const distance = haversine(prev, next);

  // v2's PathMarkerService merged points closer than this instead of storing a row.
  // Standing still should cost nothing: no row, no battery, no false movement.
  if (distance < CONSOLIDATE_RADIUS_M) return { ok: false, reason: 'consolidated' };

  if (distance / (dt / 1000) > MAX_SPEED_MS) return { ok: false, reason: 'speed' };

  return OK;
}

export interface FilterOutcome {
  accepted: TrailPoint[];
  result: TrailResult;
}

/**
 * Run a batch through the filter, carrying `prev` across the whole sequence.
 *
 * `prev` advances only on acceptance. That is the point: a single wild fix in the middle
 * of a good walk is dropped and the next real point is still measured from the last
 * *trusted* position, rather than from the outlier.
 */
export function filterTrail(previous: TrailPoint | null, points: readonly TrailPoint[]): FilterOutcome {
  const accepted: TrailPoint[] = [];
  const counts = new Map<RejectReason, number>();
  let prev = previous;
  let distanceM = 0;

  for (const point of points) {
    const verdict = acceptPoint(prev, point);
    if (verdict.ok) {
      if (prev !== null) distanceM += haversine(prev, point);
      accepted.push(point);
      prev = point;
    } else {
      counts.set(verdict.reason, (counts.get(verdict.reason) ?? 0) + 1);
    }
  }

  return {
    accepted,
    result: {
      accepted: accepted.length,
      rejected: [...counts].map(([reason, count]) => ({ reason, count })),
      distanceM,
    },
  };
}
