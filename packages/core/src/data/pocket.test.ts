/**
 * The phone-in-a-pocket walk.
 *
 * Reported from a real outdoor test: the phone was pocketed, the browser opened now and
 * then, coordinates did arrive — and the resulting border was nothing like the route
 * walked. Two separate causes, both reproduced here.
 */
import { describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { OBSERVATION_GAP_MS } from '../rules/constants.js';
import { accrueDwell, MAX_DWELL_GAP_MS } from '../rules/dwell.js';
import type { TrailPoint } from '../types/domain.js';
import { planWalk } from './walking.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const ME = { id: 'me', level: 1 };
const T0 = Date.parse('2026-08-27T12:00:00Z');

/** A straight walk north, one fix every ten seconds at walking pace. */
function leg(from: { lat: number; lng: number }, startT: number, steps: number): TrailPoint[] {
  return Array.from({ length: steps }, (_, i) => ({
    ...destination(from, 0, i * 12),
    t: startT + i * 10_000,
    accuracy: 8,
  }));
}

function walk(points: readonly TrailPoint[]) {
  return planWalk(points, {
    attacker: ME,
    known: new Map(),
    dwell: {},
    previous: null,
    hasTerritory: false,
  });
}

describe('a walk interrupted by a frozen page', () => {
  const first = leg(ORIGIN, T0, 20);
  const away = destination(ORIGIN, 0, 1_400);
  /** Twelve minutes later and 1.4 km on: the page was asleep for all of it. */
  const second = leg(away, T0 + 20 * 10_000 + 12 * 60_000, 20);

  it('kept claiming ground after the gap', () => {
    // The bug: every step after the gap failed the adjacency test, because the player
    // resumed nowhere near what they held. The walk drew a line and took nothing.
    const plan = walk([...first, ...second]);
    const afterGap = plan.steps.slice(first.length);

    expect(afterGap.some((s) => s.outcome !== null)).toBe(true);
    expect(afterGap.every((s) => s.skipped === 'not-adjacent')).toBe(false);
  });

  it('marks the one step that resumed, and only that one', () => {
    const plan = walk([...first, ...second]);
    expect(plan.steps.filter((s) => s.resumed)).toHaveLength(1);
    expect(plan.steps[first.length]?.resumed).toBe(true);
  });

  it('reports how long it was not watching', () => {
    const plan = walk([...first, ...second]);
    expect(plan.unobservedMs).toBeGreaterThanOrEqual(12 * 60_000);
  });

  it('still refuses a jump that arrives without a gap', () => {
    // The anti-jump guard is the reason adjacency exists, and it has to survive this.
    const jump = [
      ...first,
      { ...destination(ORIGIN, 90, 900), t: T0 + 20 * 10_000 + 10_000, accuracy: 8 },
    ];
    const plan = walk(jump);
    expect(plan.steps[plan.steps.length - 1]?.skipped).toBe('not-adjacent');
  });
});

describe('dwell across a gap', () => {
  const HERE = cellAt(ORIGIN);
  const THERE = cellAt(destination(ORIGIN, 0, 1_400));

  it('credits a long gap in full when the player never left', () => {
    const dwell = accrueDwell({}, { h3: HERE, t: T0 }, { h3: HERE, t: T0 + 3 * 60 * 60_000 });
    expect(dwell[HERE]).toBe(MAX_DWELL_GAP_MS);
  });

  it('does not crown the cell the screen happened to go off in', () => {
    // Twenty minutes of pocketed walking is not twenty minutes of standing still, and
    // uncapped it would hand an Anchor Stone to a bus stop.
    const dwell = accrueDwell({}, { h3: HERE, t: T0 }, { h3: THERE, t: T0 + 20 * 60_000 });
    expect(dwell[HERE]).toBe(OBSERVATION_GAP_MS);
  });
});
