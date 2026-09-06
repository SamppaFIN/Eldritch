/**
 * BRDC-HEX-002 — a hex counts separate arrivals, not fixes.
 *
 * "Montako kertaa olet siellä käynyt (eri kerroilla)" — so standing still through a
 * hundred fixes is one visit, and walking away and back is two. The ley-line drives it:
 * `planWalk` bumps the count when the settled cell changes, which is also what makes it
 * immune to the jitter `stickyDwell` exists to absorb.
 */
import { describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { recordVisit } from '../rules/growth.js';
import type { Cell, TrailPoint } from '../types/domain.js';
import { planWalk } from './walking.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const HOME = cellAt(ORIGIN);
const ME = { id: 'me', level: 1 };
const T0 = Date.parse('2026-08-27T12:00:00Z');

/** A straight walk on `bearing`, one fix every ten seconds at walking pace. */
function leg(
  from: { lat: number; lng: number },
  bearing: number,
  startT: number,
  steps: number,
): TrailPoint[] {
  return Array.from({ length: steps }, (_, i) => ({
    ...destination(from, bearing, i * 12),
    t: startT + i * 10_000,
    accuracy: 8,
  }));
}

function walk(points: readonly TrailPoint[], known = new Map<string, Cell>()) {
  const plan = planWalk(points, {
    attacker: ME,
    known,
    dwell: {},
    previous: null,
    hasTerritory: false,
  });
  return { plan, known };
}

describe('recordVisit', () => {
  const cell: Cell = { h3: HOME, ownerId: 'me', strength: 300, lastVisitedAt: T0, visitDays: [] };

  it('starts an uncounted cell at one and never mutates its input', () => {
    expect(recordVisit(cell).visits).toBe(1);
    expect(cell.visits).toBeUndefined();
  });

  it('counts up from whatever is already there', () => {
    expect(recordVisit({ ...cell, visits: 11 }).visits).toBe(12);
  });
});

describe('the ley-line counts arrivals', () => {
  it('standing still for two hundred fixes is one visit', () => {
    const still: TrailPoint[] = Array.from({ length: 200 }, (_, i) => ({
      ...ORIGIN,
      t: T0 + i * 10_000,
      accuracy: 8,
    }));
    const { known } = walk(still);
    expect(known.get(HOME)?.visits).toBe(1);
  });

  it('walking away and back is two', () => {
    const out = leg(ORIGIN, 0, T0, 20);
    const far = destination(ORIGIN, 0, 19 * 12);
    const back = leg(far, 180, T0 + 20 * 10_000, 20);
    // End exactly where we started, so the last cell is unambiguously HOME.
    const home: TrailPoint = { ...ORIGIN, t: T0 + 40 * 10_000, accuracy: 8 };

    const { known } = walk([...out, ...back, home]);
    expect(known.get(HOME)?.visits).toBe(2);
  });

  it('a walk in a straight line never counts the same hex twice', () => {
    const { known } = walk(leg(ORIGIN, 0, T0, 20));
    const counted = [...known.values()].filter((c) => c.visits !== undefined);
    // Several hexes on a 228 m leg, and not one of them arrived at more than once.
    expect(counted.length).toBeGreaterThan(1);
    for (const c of counted) expect(c.visits, c.h3).toBe(1);
  });

  it('a flush mid-stand does not invent a second visit', () => {
    // The trail batches every ten seconds; without carrying the seam, the first point of
    // every batch would read as a fresh arrival and a stationary phone would tick forever.
    const known = new Map<string, Cell>();
    const first = planWalk(
      Array.from({ length: 5 }, (_, i) => ({ ...ORIGIN, t: T0 + i * 10_000, accuracy: 8 })),
      { attacker: ME, known, dwell: {}, previous: null, hasTerritory: false },
    );
    planWalk(
      Array.from({ length: 5 }, (_, i) => ({ ...ORIGIN, t: T0 + (5 + i) * 10_000, accuracy: 8 })),
      {
        attacker: ME,
        known,
        dwell: first.dwell,
        previous: first.lastReading,
        hasTerritory: true,
      },
    );
    expect(known.get(HOME)?.visits).toBe(1);
  });
});
