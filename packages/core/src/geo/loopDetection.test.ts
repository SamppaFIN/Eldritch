import { describe, expect, it } from 'vitest';
import { LOOP_CLOSE_RADIUS_M, MIN_LOOP_AREA_M2, MIN_LOOP_POINTS } from '../rules/constants.js';
import { fixture } from '../sim/fixtures/index.js';
import { simulatePolygon, simulateWalk } from '../sim/walk.js';
import type { TrailPoint } from '../types/domain.js';
import { polygonAreaM2, signedAreaM2 } from './area.js';
import { detectLoop, detectLoops, maxLoopAreaM2 } from './loopDetection.js';
import { destination } from './project.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

/** Axis-aligned square of `side` metres, south-west corner at `sw`. */
function square(sw: { lat: number; lng: number }, side: number) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

describe('polygonAreaM2', () => {
  it('measures a square', () => {
    // 100 m square, walked as a ring of its four corners.
    expect(polygonAreaM2(square(ORIGIN, 100))).toBeCloseTo(10_000, -2);
  });

  it('is zero for a degenerate ring', () => {
    expect(polygonAreaM2([])).toBe(0);
    expect(polygonAreaM2([ORIGIN])).toBe(0);
    expect(polygonAreaM2([ORIGIN, destination(ORIGIN, 0, 100)])).toBe(0);
  });

  it('is near zero for an out-and-back line', () => {
    // The shape at the heart of the mechanic: ends where it started, encloses nothing.
    const far = destination(ORIGIN, 30, 200);
    const mid = destination(ORIGIN, 30, 100);
    expect(polygonAreaM2([ORIGIN, mid, far, mid])).toBeLessThan(1);
  });

  it('does not care which way round the ring was walked', () => {
    const ring = square(ORIGIN, 100);
    expect(polygonAreaM2(ring)).toBeCloseTo(polygonAreaM2([...ring].reverse()), 3);
  });

  it('signs the area by winding order', () => {
    const ring = square(ORIGIN, 100);
    expect(Math.sign(signedAreaM2(ring))).toBe(-Math.sign(signedAreaM2([...ring].reverse())));
  });
});

describe('maxLoopAreaM2', () => {
  it('grows ten percent per level', () => {
    expect(maxLoopAreaM2(10)).toBeCloseTo(maxLoopAreaM2(0) * 2, 5);
  });

  it('never goes below the base ceiling', () => {
    expect(maxLoopAreaM2(-5)).toBe(maxLoopAreaM2(0));
  });
});

describe('detectLoop — the fixture truth table', () => {
  it('square closes once, enclosing roughly the block', () => {
    const loops = detectLoops(fixture('square').points);
    expect(loops).toHaveLength(1);
    // A 120 m block is 14 400 m². GPS noise moves that around a little.
    expect(loops[0]?.areaM2).toBeGreaterThan(10_000);
    expect(loops[0]?.areaM2).toBeLessThan(20_000);
  });

  it('figure-eight closes twice, as two separate rings', () => {
    const loops = detectLoops(fixture('figure-eight').points);
    expect(loops).toHaveLength(2);
    // Two 100 m blocks. Neither is the other, and neither is both.
    for (const loop of loops) {
      expect(loop.areaM2).toBeGreaterThan(6_000);
      expect(loop.areaM2).toBeLessThan(16_000);
    }
    expect(loops[1]?.startIndex).toBeGreaterThan(loops[0]?.endIndex ?? 0);
  });

  it('open-line never closes', () => {
    expect(detectLoops(fixture('open-line').points)).toHaveLength(0);
    const result = detectLoop(fixture('open-line').points);
    expect(result).toEqual({ closed: false, reason: 'no-closure' });
  });

  it('back-and-forth never closes, and says why', () => {
    // The one that matters. It ends within the close radius of its start, so a
    // proximity test would hand over territory for walking up the street and back.
    const points = fixture('back-and-forth').points;
    const first = points[0] as TrailPoint;
    const last = points[points.length - 1] as TrailPoint;

    // Confirm the trap is really set before asserting the escape.
    expect(polygonAreaM2(points)).toBeLessThan(MIN_LOOP_AREA_M2);

    expect(detectLoops(points)).toHaveLength(0);
    const result = detectLoop(points);
    expect(result.closed).toBe(false);
    if (!result.closed) expect(result.reason).toBe('no-area');

    // And it really was close enough to fool a naive check.
    expect(
      Math.hypot((last.lat - first.lat) * 111_320, (last.lng - first.lng) * 53_000),
    ).toBeLessThan(LOOP_CLOSE_RADIUS_M);
  });

  it('gps-noise still closes despite 12 m scatter', () => {
    const loops = detectLoops(fixture('gps-noise').points);
    expect(loops).toHaveLength(1);
    expect(loops[0]?.areaM2).toBeGreaterThan(8_000);
  });
});

describe('detectLoop — guards', () => {
  const ring = () => simulatePolygon(square(ORIGIN, 120), { seed: 11, noiseM: 2 });

  it('refuses a trail shorter than MIN_LOOP_POINTS', () => {
    const points = ring().slice(0, MIN_LOOP_POINTS - 1);
    expect(detectLoop(points)).toEqual({ closed: false, reason: 'too-few-points' });
  });

  it('does not close against the fix it just left', () => {
    // Standing still produces a cluster of points inside the close radius. Without
    // the minimum-points guard this would close a loop of zero size immediately.
    const still = simulateWalk({
      start: ORIGIN,
      pattern: 'stop',
      durationMs: 300_000,
      noiseM: 3,
      seed: 5,
    });
    expect(detectLoop(still).closed).toBe(false);
  });

  it('rejects a loop that took too long', () => {
    const points = ring();
    expect(detectLoop(points, { maxDurationMs: 1 })).toEqual({
      closed: false,
      reason: 'too-slow',
    });
  });

  it('rejects a loop larger than the level allows', () => {
    // A 2 km block is 4 km² — driven, not walked.
    const huge = simulatePolygon(square(ORIGIN, 2_000), { seed: 3, noiseM: 0, speedMs: 8 });
    const result = detectLoop(huge, { level: 1 });
    expect(result.closed).toBe(false);
  });

  it('lets a higher level claim a larger loop', () => {
    const side = 260; // ~67 600 m², over the level-1 ceiling of 55 000
    const big = simulatePolygon(square(ORIGIN, side), { seed: 4, noiseM: 1 });

    expect(detectLoop(big, { level: 1 }).closed).toBe(false);
    expect(detectLoop(big, { level: 20 }).closed).toBe(true);
  });

  it('returns the ring itself, first point to closing point', () => {
    const points = ring();
    const result = detectLoop(points);
    expect(result.closed).toBe(true);
    if (!result.closed) return;

    expect(result.loop.points[0]).toEqual(points[result.loop.startIndex]);
    expect(result.loop.points.at(-1)).toEqual(points[result.loop.endIndex]);
    expect(result.loop.durationMs).toBeGreaterThan(0);
  });

  it('prefers the largest ring the walker completed', () => {
    // A lap with a small kink near the end: the player walked the lap, so the lap
    // is what they get — not the kink.
    const points = ring();
    const result = detectLoop(points);
    expect(result.closed).toBe(true);
    if (result.closed) expect(result.loop.startIndex).toBeLessThan(3);
  });
});

describe('detectLoops', () => {
  it('consumes a ring so it cannot be counted twice', () => {
    const loops = detectLoops(fixture('square').points);
    expect(loops).toHaveLength(1);
  });

  it('is empty for an empty trail', () => {
    expect(detectLoops([])).toEqual([]);
  });

  it('reports indices into the original trail', () => {
    const loops = detectLoops(fixture('figure-eight').points);
    const points = fixture('figure-eight').points;
    for (const loop of loops) {
      expect(points[loop.startIndex]).toEqual(loop.points[0]);
      expect(points[loop.endIndex]).toEqual(loop.points.at(-1));
    }
  });
});
