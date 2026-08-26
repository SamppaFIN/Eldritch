import { describe, expect, it } from 'vitest';
import {
  CONSOLIDATE_RADIUS_M,
  MAX_ACCURACY_M,
  MAX_SPEED_MS,
  MIN_POINT_INTERVAL_MS,
} from '../rules/constants.js';
import type { TrailPoint } from '../types/domain.js';
import { acceptPoint, filterTrail } from './filter.js';
import { EARTH_RADIUS_M, haversine, pathLength } from './haversine.js';
import { msToKmh, speedMs } from './speed.js';

const TAMPERE = { lat: 61.4978, lng: 23.761 };
const HELSINKI = { lat: 60.1699, lng: 24.9384 };
/** Statue of the Boy — the start of v2's Fuming Lake quest. */
const STATUE = { lat: 61.47290805, lng: 23.72588249 };

/** A point `metres` north of `from`. Independent of the code under test. */
function north(from: { lat: number; lng: number }, metres: number) {
  return { lat: from.lat + (metres / EARTH_RADIUS_M) * (180 / Math.PI), lng: from.lng };
}

const pt = (p: { lat: number; lng: number }, t: number, accuracy = 8): TrailPoint => ({
  ...p,
  t,
  accuracy,
});

describe('haversine', () => {
  it('is zero for a point against itself', () => {
    expect(haversine(TAMPERE, TAMPERE)).toBe(0);
  });

  it('matches a known long distance', () => {
    // Tampere to Helsinki is about 161 km great-circle.
    expect(haversine(TAMPERE, HELSINKI) / 1000).toBeCloseTo(161, 0);
  });

  it('measures a short northward offset accurately', () => {
    expect(haversine(STATUE, north(STATUE, 100))).toBeCloseTo(100, 1);
  });

  it('is symmetric', () => {
    expect(haversine(TAMPERE, HELSINKI)).toBeCloseTo(haversine(HELSINKI, TAMPERE), 6);
  });

  it('handles antipodal points without blowing up', () => {
    const d = haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(d).toBeCloseTo(Math.PI * EARTH_RADIUS_M, 0);
  });
});

describe('pathLength', () => {
  it('is zero for zero or one point', () => {
    expect(pathLength([])).toBe(0);
    expect(pathLength([STATUE])).toBe(0);
  });

  it('sums the segments', () => {
    const path = [STATUE, north(STATUE, 100), north(STATUE, 250)];
    expect(pathLength(path)).toBeCloseTo(250, 1);
  });
});

describe('speedMs', () => {
  it('computes walking pace', () => {
    const a = pt(STATUE, 0);
    const b = pt(north(STATUE, 14), 10_000); // 14 m in 10 s
    expect(speedMs(a, b)).toBeCloseTo(1.4, 2);
    expect(msToKmh(speedMs(a, b))).toBeCloseTo(5.04, 1);
  });

  it('returns 0 rather than Infinity when the clock does not advance', () => {
    expect(speedMs(pt(STATUE, 1000), pt(north(STATUE, 50), 1000))).toBe(0);
  });

  it('returns 0 for a backwards interval', () => {
    expect(speedMs(pt(STATUE, 5000), pt(north(STATUE, 50), 1000))).toBe(0);
  });
});

describe('acceptPoint', () => {
  it('accepts the first fix of a run unconditionally', () => {
    expect(acceptPoint(null, pt(STATUE, 0))).toEqual({ ok: true });
  });

  it('rejects a fix worse than MAX_ACCURACY_M', () => {
    expect(acceptPoint(null, pt(STATUE, 0, MAX_ACCURACY_M + 1))).toEqual({
      ok: false,
      reason: 'accuracy',
    });
  });

  it('accepts a fix exactly at MAX_ACCURACY_M', () => {
    expect(acceptPoint(null, pt(STATUE, 0, MAX_ACCURACY_M)).ok).toBe(true);
  });

  it('rejects non-finite coordinates', () => {
    expect(acceptPoint(null, pt({ lat: Number.NaN, lng: 0 }, 0))).toEqual({
      ok: false,
      reason: 'accuracy',
    });
  });

  it('rejects fixes arriving faster than MIN_POINT_INTERVAL_MS', () => {
    const a = pt(STATUE, 0);
    const b = pt(north(STATUE, 20), MIN_POINT_INTERVAL_MS - 1);
    expect(acceptPoint(a, b)).toEqual({ ok: false, reason: 'interval' });
  });

  it('consolidates a fix that has barely moved', () => {
    const a = pt(STATUE, 0);
    const b = pt(north(STATUE, 3), 10_000);
    expect(acceptPoint(a, b)).toEqual({ ok: false, reason: 'consolidated' });
  });

  it('accepts a fix just past the consolidation radius', () => {
    const a = pt(STATUE, 0);
    const b = pt(north(STATUE, CONSOLIDATE_RADIUS_M + 1), 10_000);
    expect(acceptPoint(a, b).ok).toBe(true);
  });

  it('rejects an impossible speed', () => {
    // 100 m in 5 s is 20 m/s — a car, not a walk.
    const a = pt(STATUE, 0);
    const b = pt(north(STATUE, 100), MIN_POINT_INTERVAL_MS);
    expect(acceptPoint(a, b)).toEqual({ ok: false, reason: 'speed' });
  });

  it('accepts a brisk but human pace', () => {
    const a = pt(STATUE, 0);
    const b = pt(north(STATUE, (MAX_SPEED_MS - 1) * 10), 10_000);
    expect(acceptPoint(a, b).ok).toBe(true);
  });

  it('checks accuracy before speed, so the reason is the true cause', () => {
    // A wildly inaccurate fix also implies an impossible speed. The player needs to
    // be told the signal is bad, not that they were moving too fast.
    const a = pt(STATUE, 0);
    const b = pt(north(STATUE, 400), 10_000, 120);
    expect(acceptPoint(a, b)).toEqual({ ok: false, reason: 'accuracy' });
  });
});

describe('filterTrail', () => {
  it('keeps good points and reports distance', () => {
    const points = [
      pt(STATUE, 0),
      pt(north(STATUE, 15), 10_000),
      pt(north(STATUE, 30), 20_000),
    ];
    const { accepted, result } = filterTrail(null, points);
    expect(accepted).toHaveLength(3);
    expect(result.rejected).toEqual([]);
    expect(result.distanceM).toBeCloseTo(30, 1);
  });

  it('groups rejections by reason', () => {
    const points = [
      pt(STATUE, 0),
      pt(north(STATUE, 15), 1_000), // interval
      pt(north(STATUE, 15), 10_000), // ok
      pt(north(STATUE, 16), 20_000), // consolidated
      pt(north(STATUE, 17), 30_000, 90), // accuracy
    ];
    const { result } = filterTrail(null, points);
    expect(result.accepted).toBe(2);
    expect(new Map(result.rejected.map((r) => [r.reason, r.count]))).toEqual(
      new Map([
        ['interval', 1],
        ['consolidated', 1],
        ['accuracy', 1],
      ]),
    );
  });

  it('measures the next good point from the last trusted one, not from an outlier', () => {
    // A single bad fix must not drag the trail with it.
    const outlier = pt({ lat: 61.6, lng: 23.9 }, 10_000, 200);
    const points = [pt(STATUE, 0), outlier, pt(north(STATUE, 20), 20_000)];
    const { accepted, result } = filterTrail(null, points);

    expect(accepted).toHaveLength(2);
    expect(result.distanceM).toBeCloseTo(20, 1);
  });

  it('carries `previous` in from an earlier batch', () => {
    const previous = pt(STATUE, 0);
    const { accepted } = filterTrail(previous, [pt(north(STATUE, 2), 10_000)]);
    expect(accepted).toEqual([]); // consolidated against the earlier batch
  });

  it('handles an empty batch', () => {
    const { accepted, result } = filterTrail(null, []);
    expect(accepted).toEqual([]);
    expect(result).toEqual({ accepted: 0, rejected: [], distanceM: 0 });
  });
});
