import { describe, expect, it } from 'vitest';
import { acceptPoint, haversine, pathLength, speedMs } from '../geo/index.js';
import { bearing, destination } from '../geo/project.js';
import { MAX_ACCURACY_M, MAX_SPEED_MS } from '../rules/constants.js';
import type { TrailPoint } from '../types/domain.js';
import { FIXTURE_NAMES, fixture } from './fixtures/index.js';
import { prng, simulatePolygon, simulateWalk } from './walk.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

describe('prng', () => {
  it('is deterministic for a seed', () => {
    const a = Array.from({ length: 5 }, prng(42));
    const b = Array.from({ length: 5 }, prng(42));
    expect(a).toEqual(b);
  });

  it('differs between seeds', () => {
    expect(prng(1)()).not.toBe(prng(2)());
  });

  it('stays in [0, 1)', () => {
    const rnd = prng(7);
    for (let i = 0; i < 500; i++) {
      const v = rnd();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('destination / bearing round-trip', () => {
  it('lands the requested distance away', () => {
    const there = destination(ORIGIN, 45, 250);
    expect(haversine(ORIGIN, there)).toBeCloseTo(250, 1);
  });

  it('lands on the requested bearing', () => {
    expect(bearing(ORIGIN, destination(ORIGIN, 137, 300))).toBeCloseTo(137, 1);
  });

  it('inverts itself', () => {
    const there = destination(ORIGIN, 200, 500);
    const back = destination(there, bearing(there, ORIGIN), haversine(there, ORIGIN));
    expect(haversine(back, ORIGIN)).toBeLessThan(0.01);
  });
});

describe('simulateWalk', () => {
  const base = { start: ORIGIN, durationMs: 120_000, seed: 9 } as const;

  it('is deterministic for a seed', () => {
    const a = simulateWalk({ ...base, pattern: 'straight' });
    const b = simulateWalk({ ...base, pattern: 'straight' });
    expect(a).toEqual(b);
  });

  it('produces a different trace for a different seed', () => {
    const a = simulateWalk({ ...base, pattern: 'random' });
    const b = simulateWalk({ ...base, pattern: 'random', seed: 10 });
    expect(a).not.toEqual(b);
  });

  it('emits one fix per interval', () => {
    const pts = simulateWalk({ ...base, pattern: 'straight', intervalMs: 5_000 });
    expect(pts).toHaveLength(120_000 / 5_000 + 1);
  });

  it('walks at roughly the requested pace', () => {
    const pts = simulateWalk({ ...base, pattern: 'straight', durationMs: 600_000, noiseM: 0 });
    const seconds = (pts.at(-1) as TrailPoint).t / 1000;
    expect(pathLength(pts) / seconds).toBeCloseTo(1.4, 1);
  });

  it('produces fixes a real filter accepts', () => {
    const pts = simulateWalk({ ...base, pattern: 'curve', durationMs: 600_000 });
    let prev: TrailPoint | null = null;
    let accepted = 0;
    for (const p of pts) {
      if (acceptPoint(prev, p).ok) {
        accepted++;
        prev = p;
      }
    }
    // Noise consolidates the odd fix; the great majority must survive.
    expect(accepted / pts.length).toBeGreaterThan(0.8);
  });

  it('never implies an impossible speed', () => {
    const pts = simulateWalk({ ...base, pattern: 'random', durationMs: 600_000 });
    for (let i = 1; i < pts.length; i++) {
      expect(speedMs(pts[i - 1] as TrailPoint, pts[i] as TrailPoint)).toBeLessThan(MAX_SPEED_MS);
    }
  });

  it('stays put on the "stop" pattern', () => {
    const pts = simulateWalk({ ...base, pattern: 'stop', durationMs: 300_000, noiseM: 2 });
    for (const p of pts) expect(haversine(ORIGIN, p)).toBeLessThan(15);
  });

  it('rejects standing-still fixes as consolidated, not as movement', () => {
    const pts = simulateWalk({ ...base, pattern: 'stop', durationMs: 300_000, noiseM: 1 });
    let prev: TrailPoint | null = pts[0] as TrailPoint;
    const reasons = new Set<string>();
    for (const p of pts.slice(1)) {
      const v = acceptPoint(prev, p);
      if (!v.ok) reasons.add(v.reason);
      else prev = p;
    }
    expect(reasons).toContain('consolidated');
    expect(reasons).not.toContain('speed');
  });

  it('curves', () => {
    const pts = simulateWalk({ ...base, pattern: 'curve', durationMs: 300_000, noiseM: 0 });
    const first = bearing(pts[0] as TrailPoint, pts[1] as TrailPoint);
    const last = bearing(pts.at(-2) as TrailPoint, pts.at(-1) as TrailPoint);
    expect(Math.abs(last - first)).toBeGreaterThan(10);
  });
});

describe('simulatePolygon', () => {
  it('returns to where it started', () => {
    const side = 120;
    const sw = ORIGIN;
    const ne = destination(destination(sw, 0, side), 90, side);
    const pts = simulatePolygon(
      [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }],
      { seed: 1, noiseM: 0 },
    );
    expect(haversine(pts[0] as TrailPoint, pts.at(-1) as TrailPoint)).toBeLessThan(1);
  });

  it('walks the whole perimeter', () => {
    const side = 120;
    const sw = ORIGIN;
    const ne = destination(destination(sw, 0, side), 90, side);
    const pts = simulatePolygon(
      [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }],
      { seed: 1, noiseM: 0 },
    );
    expect(pathLength(pts)).toBeCloseTo(side * 4, -1);
  });

  it('returns nothing for a degenerate input', () => {
    expect(simulatePolygon([])).toEqual([]);
    expect(simulatePolygon([ORIGIN])).toEqual([]);
  });
});

describe('fixtures', () => {
  it('ships all five', () => {
    expect(FIXTURE_NAMES).toEqual([
      'square',
      'figure-eight',
      'open-line',
      'back-and-forth',
      'gps-noise',
    ]);
  });

  it.each(FIXTURE_NAMES)('%s is well-formed and monotonic in time', (name) => {
    const { points } = fixture(name);
    expect(points.length).toBeGreaterThan(8);
    for (let i = 0; i < points.length; i++) {
      const p = points[i] as TrailPoint;
      expect(Number.isFinite(p.lat)).toBe(true);
      expect(Number.isFinite(p.lng)).toBe(true);
      if (i > 0) expect(p.t).toBeGreaterThan((points[i - 1] as TrailPoint).t);
    }
  });

  it('square closes on itself', () => {
    const { points } = fixture('square');
    expect(haversine(points[0] as TrailPoint, points.at(-1) as TrailPoint)).toBeLessThan(25);
  });

  it('open-line never comes back', () => {
    const { points } = fixture('open-line');
    expect(haversine(points[0] as TrailPoint, points.at(-1) as TrailPoint)).toBeGreaterThan(100);
  });

  it('back-and-forth ends where it started but encloses nothing', () => {
    // Both halves of this are the point. It looks closed by distance, which is exactly
    // why loop detection cannot rely on distance alone.
    const { points } = fixture('back-and-forth');
    expect(haversine(points[0] as TrailPoint, points.at(-1) as TrailPoint)).toBeLessThan(25);
    expect(shoelaceAreaM2(points)).toBeLessThan(500);
  });

  it('square encloses a real area, unlike back-and-forth', () => {
    expect(shoelaceAreaM2(fixture('square').points)).toBeGreaterThan(10_000);
  });

  it('gps-noise stays inside MAX_ACCURACY_M so the filter still takes it', () => {
    for (const p of fixture('gps-noise').points) {
      expect(p.accuracy).toBeLessThanOrEqual(MAX_ACCURACY_M);
    }
  });
});

/**
 * Local area helper. Deliberately not exported: the real one arrives with
 * BRDC-CLAIM-001, and duplicating it here keeps this test honest about only
 * checking fixture shape.
 */
function shoelaceAreaM2(points: readonly TrailPoint[]): number {
  if (points.length < 3) return 0;
  const lat0 = (points[0] as TrailPoint).lat;
  const mLat = 111_320;
  const mLng = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i] as TrailPoint;
    const b = points[(i + 1) % points.length] as TrailPoint;
    sum += a.lng * mLng * (b.lat * mLat) - b.lng * mLng * (a.lat * mLat);
  }
  return Math.abs(sum / 2);
}
