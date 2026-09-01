/**
 * BRDC-TRAIL-003 — segmentation is deterministic, tiers only rise, pruning keeps the worn.
 */
import { describe, expect, it } from 'vitest';
import { MAX_PATH_SEGMENTS, PATH_TIERS, PATH_TIER_VISITS } from '../rules/constants.js';
import { bankEdges, prunePaths, tierOf, trailEdges, walkedEdges } from './paths.js';
import type { PathSegment } from './paths.js';
import type { LatLng } from '../types/domain.js';

// A short walk near Tampere: five points heading roughly north-east, ~12 m apart.
const WALK: LatLng[] = [
  { lat: 61.4729, lng: 23.7259 },
  { lat: 61.47301, lng: 23.72605 },
  { lat: 61.47312, lng: 23.7262 },
  { lat: 61.47323, lng: 23.72635 },
  { lat: 61.47334, lng: 23.7265 },
];

describe('trailEdges', () => {
  it('is deterministic — the same trace gives the same edges', () => {
    expect(trailEdges(WALK)).toEqual(trailEdges([...WALK]));
  });

  it('turns a moving trace into undirected edges, walked either way', () => {
    const there = trailEdges(WALK);
    const back = trailEdges([...WALK].reverse());
    expect(there.length).toBeGreaterThan(0);
    expect([...there].sort()).toEqual([...back].sort());
    for (const edge of there) {
      const [a, b] = edge.split(':') as [string, string];
      expect(a <= b).toBe(true);
    }
  });

  it('wears nothing while standing still', () => {
    const still = Array.from({ length: 20 }, () => ({ lat: 61.4729, lng: 23.7259 }));
    expect(trailEdges(still)).toEqual([]);
    expect(trailEdges(WALK.slice(0, 1))).toEqual([]);
    expect(trailEdges([])).toEqual([]);
  });

  it('drops a repeated cell rather than making a self-edge', () => {
    const dithered = [WALK[0], WALK[0], WALK[1], WALK[1], WALK[2]] as LatLng[];
    for (const edge of trailEdges(dithered)) {
      const [a, b] = edge.split(':') as [string, string];
      expect(a).not.toBe(b);
    }
  });
});

describe('tierOf', () => {
  it('names the five tiers by visit count', () => {
    expect(tierOf(0)).toBe('path');
    expect(tierOf(PATH_TIER_VISITS[1])).toBe('track');
    expect(tierOf(PATH_TIER_VISITS[4])).toBe('rail');
  });

  it('is monotonic, and the last tier has no ceiling', () => {
    let seen = 0;
    for (let v = 0; v <= 200; v += 1) {
      const idx = PATH_TIERS.indexOf(tierOf(v));
      expect(idx).toBeGreaterThanOrEqual(seen);
      seen = idx;
    }
    expect(tierOf(10_000)).toBe('rail');
  });
});

describe('bankEdges', () => {
  it('adds a visit per edge and stamps the time, without mutating the input', () => {
    const before: Record<string, PathSegment> = { 'a:b': { visits: 2, lastAt: 100 } };
    const after = bankEdges(before, ['a:b', 'b:c'], 500);
    expect(after['a:b']).toEqual({ visits: 3, lastAt: 500 });
    expect(after['b:c']).toEqual({ visits: 1, lastAt: 500 });
    expect(before['a:b']).toEqual({ visits: 2, lastAt: 100 });
  });
});

describe('prunePaths', () => {
  it('returns a copy untouched while under the cap', () => {
    const map: Record<string, PathSegment> = { x: { visits: 1, lastAt: 1 } };
    const out = prunePaths(map, 10);
    expect(out).toEqual(map);
    expect(out).not.toBe(map);
  });

  it('keeps the cap-many most-worn, and never drops one above a kept one', () => {
    const map: Record<string, PathSegment> = {};
    for (let i = 0; i < 50; i += 1) map[`e${i}`] = { visits: i, lastAt: i };
    const kept = prunePaths(map, 10);

    expect(Object.keys(kept)).toHaveLength(10);
    const keptMin = Math.min(...Object.values(kept).map((s) => s.visits));
    const dropped = Object.entries(map).filter(([k]) => !(k in kept));
    for (const [, seg] of dropped) expect(seg.visits).toBeLessThanOrEqual(keptMin);
  });

  it('breaks ties toward the most recently walked', () => {
    const map: Record<string, PathSegment> = {
      old: { visits: 5, lastAt: 1 },
      fresh: { visits: 5, lastAt: 9 },
      keep: { visits: 9, lastAt: 1 },
    };
    expect(Object.keys(prunePaths(map, 2)).sort()).toEqual(['fresh', 'keep']);
  });

  it('the real cap is comfortably above a long walk', () => {
    expect(trailEdges(WALK).length).toBeLessThan(MAX_PATH_SEGMENTS);
  });
});

describe('walkedEdges', () => {
  it('resolves endpoints and attaches the tier', () => {
    const [edge] = trailEdges(WALK);
    const drawn = walkedEdges({ [edge as string]: { visits: PATH_TIER_VISITS[2], lastAt: 0 } });
    expect(drawn).toHaveLength(1);
    expect(drawn[0]?.tier).toBe('road');
    expect(drawn[0]?.a).toMatchObject({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(drawn[0]?.b.lat).not.toBe(drawn[0]?.a.lat);
  });
});
