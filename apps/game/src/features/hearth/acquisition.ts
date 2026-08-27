/**
 * Waiting for the phone to actually know where it is.
 *
 * A browser hands over its first fix immediately and it is usually a lie: derived from
 * the cell tower or the wifi it can see, accurate to somewhere between fifty metres and
 * two kilometres. The GPS chip catches up over the next ten to thirty seconds and the
 * fixes tighten. Fitness apps all do the same thing with that interval — they refuse to
 * start until the fixes stop moving — and this is that, because the cell a player is
 * given as their Hearth is one they keep.
 *
 * Two conditions, not one. Accuracy is what the device claims; spread is what it has
 * actually demonstrated. A device can report ±8 m while its fixes wander forty metres
 * apart, and only the second of those is evidence.
 */
import { haversine } from '@es3/core';
import type { TrailPoint } from '@es3/core';

/** Better than this and there is nothing to wait for. */
export const SHARP_M = 10;
/** Good enough to hand someone a cell they will keep. */
export const USABLE_M = 25;
/** Fixes considered when judging whether the device has settled. */
export const STABLE_SAMPLES = 4;
/** How far the recent fixes may wander and still count as agreeing. */
export const STABLE_SPREAD_M = 20;

export type FixTier = 'waiting' | 'coarse' | 'usable' | 'sharp';

export interface Acquisition {
  /** The best fix seen so far, or null before the first one. */
  fix: TrailPoint | null;
  accuracyM: number | null;
  tier: FixTier;
  /** How far apart the recent fixes are. Null until there are enough of them. */
  spreadM: number | null;
  /** The device has settled: good accuracy and fixes that agree. */
  ready: boolean;
  samples: number;
}

function tierFor(accuracyM: number | null): FixTier {
  if (accuracyM === null) return 'waiting';
  if (accuracyM <= SHARP_M) return 'sharp';
  if (accuracyM <= USABLE_M) return 'usable';
  return 'coarse';
}

/**
 * Judge a run of fixes.
 *
 * The chosen fix is the most accurate one, not the newest: a device that reported ±6 m
 * a moment ago and ±40 m now has not moved, it has lost a satellite, and the earlier
 * answer is still the better one.
 */
export function assess(samples: readonly TrailPoint[]): Acquisition {
  if (samples.length === 0) {
    return { fix: null, accuracyM: null, tier: 'waiting', spreadM: null, ready: false, samples: 0 };
  }

  const best = samples.reduce((a, b) => (b.accuracy < a.accuracy ? b : a));

  const recent = samples.slice(-STABLE_SAMPLES);
  let spreadM: number | null = null;
  if (recent.length >= STABLE_SAMPLES) {
    spreadM = 0;
    for (let i = 0; i < recent.length; i += 1) {
      for (let j = i + 1; j < recent.length; j += 1) {
        spreadM = Math.max(spreadM, haversine(recent[i] as TrailPoint, recent[j] as TrailPoint));
      }
    }
  }

  const tier = tierFor(best.accuracy);
  const settled = spreadM !== null && spreadM <= STABLE_SPREAD_M;

  return {
    fix: best,
    accuracyM: best.accuracy,
    tier,
    spreadM,
    // A sharp fix still has to prove it: one lucky reading is not a location.
    ready: (tier === 'sharp' || tier === 'usable') && settled,
    samples: samples.length,
  };
}

/**
 * What to tell the player while they stand there.
 *
 * Never "error" and never a bare number — they are outdoors holding a phone at arm's
 * length, and the only useful message is what to do next.
 */
export function acquisitionLine(a: Acquisition): string {
  if (a.tier === 'waiting') return 'Listening for the sky…';
  if (a.tier === 'coarse') return 'The ground is still vague — step into the open';
  if (!a.ready) return 'Almost — hold still a moment';
  return a.tier === 'sharp' ? 'The ground is certain' : 'The ground is clear enough';
}
