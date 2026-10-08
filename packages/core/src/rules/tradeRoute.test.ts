/** BRDC-TRADEROUTE-001 — a trade route from the points of a walk, on `sim/` walks. */
import { describe, expect, it } from 'vitest';
import { advanceJourney, routeGold, routesGold, ROUTE_GAP_MS } from './tradeRoute.js';
import type { RouteEnd } from './tradeRoute.js';
import { simulateWalk } from '../sim/walk.js';
import { cellAt } from '../geo/cells.js';
import type { Cell, H3Index, TrailPoint } from '../types/domain.js';

const START = { lat: 61.4729, lng: 23.7258 };
// 600 m due north at walking pace, no noise: the first and last fixes mark the two Markets.
const walk = simulateWalk({ start: START, pattern: 'straight', headingDeg: 0, durationMs: (600 / 1.4) * 1000, noiseM: 0, startTime: 0 });
const first = cellAt(walk[0] as TrailPoint);
const last = cellAt(walk[walk.length - 1] as TrailPoint);
const ends = (m: Record<H3Index, RouteEnd>) => (h3: H3Index) => m[h3] ?? null;

describe('advanceJourney', () => {
  it('Market to Market in one walk makes a route about as long as the walk', () => {
    const { made } = advanceJourney(null, walk, ends({ [first]: 'market', [last]: 'market' }));
    expect(made).toHaveLength(1);
    expect(made[0]).toMatchObject({ a: first, b: last, toVillage: false });
    expect(made[0]?.lengthM).toBeGreaterThan(500);
    expect(made[0]?.lengthM).toBeLessThan(650);
  });

  it('carries across batches: the journey is the same walk cut in two', () => {
    const half = Math.floor(walk.length / 2);
    const end = ends({ [first]: 'market', [last]: 'village' });
    const one = advanceJourney(null, walk.slice(0, half), end);
    expect(one.made).toHaveLength(0);
    expect(one.journey?.from).toBe(first);
    const two = advanceJourney(one.journey, walk.slice(half), end);
    expect(two.made[0]).toMatchObject({ a: first, b: last, toVillage: true });
    expect(two.journey).toBeNull();
  });

  it('a long pause breaks the walk, and so does going past two kilometres', () => {
    const half = Math.floor(walk.length / 2);
    const paused: TrailPoint[] = [...walk.slice(0, half), ...walk.slice(half).map((p) => ({ ...p, t: p.t + ROUTE_GAP_MS + 1 }))];
    expect(advanceJourney(null, paused, ends({ [first]: 'market', [last]: 'market' })).made).toHaveLength(0);
    const far = simulateWalk({ start: START, pattern: 'straight', headingDeg: 0, durationMs: (2_300 / 1.4) * 1000, noiseM: 0 });
    const farEnd = cellAt(far[far.length - 1] as TrailPoint);
    expect(advanceJourney(null, far, ends({ [first]: 'market', [farEnd]: 'market' })).made).toHaveLength(0);
  });

  it('no Market at the start, no route', () => {
    expect(advanceJourney(null, walk, ends({ [last]: 'market' })).made).toHaveLength(0);
  });
});

describe('routeGold and routesGold', () => {
  const route = { id: 'x', a: first, b: last, lengthM: 1_500, toVillage: false, at: 0 };
  const market = (h3: H3Index): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: 0, visitDays: [], buildings: [{ id: 'market', builtAt: 0 }] });
  it('2 gold an hour, and 1 more for each kilometre', () => {
    expect(routeGold(1_500)).toBe(3.5);
  });
  it('pays while both Markets hold, and stops when one is lost', () => {
    expect(routesGold([route], [market(first), market(last)])).toBe(3.5);
    expect(routesGold([route], [market(first)])).toBe(0);
    expect(routesGold([{ ...route, toVillage: true }], [market(first)])).toBe(3.5);
  });
});
