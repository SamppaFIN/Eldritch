/**
 * Speed between two fixes. Separate from filter.ts because the HUD reports pace and
 * the anti-cheat rejects on it, and those two callers should not share a code path
 * that anyone is tempted to "just tweak" for display purposes.
 */
import type { TrailPoint } from '../types/domain.js';
import { haversine } from './haversine.js';

/**
 * Metres per second between two fixes.
 *
 * Returns 0 for a zero or negative interval rather than Infinity or NaN: two fixes with
 * the same timestamp mean the clock is coarse, not that the player teleported, and a
 * NaN here would silently poison every average downstream.
 */
export function speedMs(a: TrailPoint, b: TrailPoint): number {
  const dt = (b.t - a.t) / 1000;
  if (dt <= 0) return 0;
  return haversine(a, b) / dt;
}

/** Convenience for the HUD. Walking pace is ~5 km/h. */
export const msToKmh = (ms: number): number => ms * 3.6;
