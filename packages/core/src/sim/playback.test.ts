/**
 * BRDC-SIM-002 — a walked route, played back as if walked now.
 */
import { describe, expect, it } from 'vitest';
import { filterTrail, haversine } from '../geo/index.js';
import { fixture } from './fixtures/index.js';
import { detour, parseRoute, retime, routeDuration, routeJson, startAt } from './playback.js';

const square = fixture('square');

describe('parseRoute', () => {
  it('reads GPX', () => {
    const gpx =
      '<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>' +
      '<trkpt lat="61.47" lon="23.72"><time>2026-10-09T10:00:00Z</time></trkpt>' +
      '<trkpt lat="61.4701" lon="23.72"><time>2026-10-09T10:00:10Z</time></trkpt>' +
      '</trkseg></trk></gpx>';
    const r = parseRoute(gpx, 'walk.gpx');
    expect(r.ok && r.route.points).toHaveLength(2);
    expect(r.ok && r.route.name).toBe('walk.gpx');
  });

  it('reads back what routeJson wrote, name and all', () => {
    const r = parseRoute(routeJson({ name: 'Tuesday', points: square.points }));
    expect(r).toEqual({ ok: true, route: { name: 'Tuesday', points: square.points } });
  });

  it('reads a fixture file and a bare array, sorted by time', () => {
    expect(parseRoute(JSON.stringify(square)).ok).toBe(true);
    const r = parseRoute(JSON.stringify([...square.points].reverse()));
    expect(r.ok && r.route.points).toEqual(square.points);
  });

  it('says what is wrong with a file it cannot play', () => {
    expect(parseRoute('{nope')).toEqual({ ok: false, fault: 'not-json' });
    expect(parseRoute('{"points": []}')).toEqual({ ok: false, fault: 'no-points' });
    expect(parseRoute(JSON.stringify([square.points[0]]))).toEqual({ ok: false, fault: 'too-short' });
    expect(parseRoute('<gpx></gpx>')).toEqual({ ok: false, fault: 'no-points' });
  });
});

describe('retime', () => {
  it('ends at the given moment and keeps every gap', () => {
    const now = Date.UTC(2026, 9, 9, 12);
    const out = retime(square.points, now);
    expect(out.at(-1)?.t).toBe(now);
    expect(routeDuration(out)).toBe(routeDuration(square.points));
    for (let i = 1; i < out.length; i += 1) {
      expect(out[i]!.t - out[i - 1]!.t).toBe(square.points[i]!.t - square.points[i - 1]!.t);
    }
  });

  it('is judged by the filter exactly as the original was', () => {
    const before = filterTrail(null, square.points);
    const after = filterTrail(null, retime(square.points, Date.now()));
    expect(after.accepted).toHaveLength(before.accepted.length);
    expect(after.result.rejected).toEqual(before.result.rejected);
  });
});

describe('startAt', () => {
  it('moves the shape, not its size', () => {
    const to = { lat: 60.17, lng: 24.94 };
    const out = startAt(square.points, to);
    expect(out[0]).toMatchObject(to);
    const a = haversine(square.points[0]!, square.points[5]!);
    const b = haversine(out[0]!, out[5]!);
    expect(Math.abs(a - b)).toBeLessThan(a * 0.02);
  });
});

describe('detour', () => {
  const from = { lat: 61.4729, lng: 23.7258, t: 1_000_000, accuracy: 8 };
  const to = { lat: 61.4747, lng: 23.7258 }; // ~200 m north

  it('walks there and back at a pace the filter takes', () => {
    const d = detour(from, to);
    const out = filterTrail(from, d);
    expect(out.result.rejected.filter((r) => r.reason === 'speed' || r.reason === 'interval')).toEqual([]);
    expect(haversine(d.at(-1)!, from)).toBeLessThan(1);
    expect(d.some((p) => haversine(p, to) < 1)).toBe(true);
  });

  it('carries on the clock from where it set out, five seconds a fix', () => {
    const d = detour(from, to);
    expect(d[0]!.t).toBe(from.t + 5_000);
    expect(d[1]!.t - d[0]!.t).toBe(5_000);
  });
});
