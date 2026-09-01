import { describe, expect, it } from 'vitest';
import type { Cell } from '../types/domain.js';
import {
  BASE_STRENGTH,
  DECAY_GRACE_HOURS,
  DECAY_LATE_AFTER_DAYS,
  DECAY_PER_DAY,
  DECAY_PER_DAY_LATE,
  MAX_STRENGTH,
} from './constants.js';
import { decayAmount, hoursUntilReleased, projectCell, sweepDecay } from './decay.js';
import { utcDay } from './day.js';

const T0 = Date.parse('2026-08-27T12:00:00Z');
const hours = (n: number) => T0 + n * 3_600_000;
const days = (n: number) => hours(n * 24);

function cell(strength: number, h3 = 'a'): Cell {
  return { h3, ownerId: 'me', strength, lastVisitedAt: T0, visitDays: [utcDay(T0)] };
}

describe('grace period', () => {
  it('costs nothing inside 48 hours', () => {
    expect(projectCell(cell(300), hours(DECAY_GRACE_HOURS - 1))?.strength).toBe(300);
    expect(projectCell(cell(300), hours(DECAY_GRACE_HOURS))?.strength).toBe(300);
  });

  it('starts costing just after', () => {
    const after = projectCell(cell(300), hours(DECAY_GRACE_HOURS + 24));
    expect(after?.strength).toBeCloseTo(300 - DECAY_PER_DAY, 5);
  });

  it('a Bulwark shelter comes off the clock (BRDC-SPELL-001)', () => {
    const sheltered: Cell = { ...cell(300), shelteredMs: 24 * 3_600_000 };
    // Age is (grace + 48 h); the 24 h shelter pulls it back to (grace + 24 h) → one day's bleed.
    const after = projectCell(sheltered, hours(DECAY_GRACE_HOURS + 48));
    expect(after?.strength).toBeCloseTo(300 - DECAY_PER_DAY, 5);
    // A shelter longer than the cell's whole age just means full grace, never negative age.
    expect(projectCell({ ...cell(300), shelteredMs: 999 * 3_600_000 }, days(30))?.strength).toBe(300);
  });
});

describe('decayAmount', () => {
  it('is zero within grace', () => {
    expect(decayAmount(0)).toBe(0);
    expect(decayAmount(DECAY_GRACE_HOURS)).toBe(0);
  });

  it('bleeds slowly for the first fortnight', () => {
    expect(decayAmount(DECAY_GRACE_HOURS + 10 * 24)).toBeCloseTo(10 * DECAY_PER_DAY, 5);
  });

  it('accelerates after two weeks', () => {
    const fortnight = decayAmount(DECAY_GRACE_HOURS + DECAY_LATE_AFTER_DAYS * 24);
    const plusOne = decayAmount(DECAY_GRACE_HOURS + (DECAY_LATE_AFTER_DAYS + 1) * 24);
    expect(plusOne - fortnight).toBeCloseTo(DECAY_PER_DAY_LATE, 5);
  });

  it('never runs backwards', () => {
    let previous = 0;
    for (let h = 0; h < 24 * 60; h += 6) {
      const amount = decayAmount(h);
      expect(amount).toBeGreaterThanOrEqual(previous);
      previous = amount;
    }
  });
});

describe('release', () => {
  it('hands a cell back to the Void at zero, not at a floor', () => {
    // A cell at zero strength is unowned ground, not a very weak cell. Returning a
    // floored cell would leave a ghost on the map that nobody can ever take.
    expect(projectCell(cell(BASE_STRENGTH), days(30))).toBeNull();
  });

  it('leaves a maxed cell standing for about a month', () => {
    // MASTERPLAN §2.1 says ~33 days. That number is the game's tempo, so it is
    // asserted rather than trusted.
    expect(projectCell(cell(MAX_STRENGTH), days(30))).not.toBeNull();
    expect(projectCell(cell(MAX_STRENGTH), days(35))).toBeNull();
  });

  it('gives a freshly claimed cell about twelve days', () => {
    expect(projectCell(cell(BASE_STRENGTH), days(11))).not.toBeNull();
    expect(projectCell(cell(BASE_STRENGTH), days(13))).toBeNull();
  });

  it('leaves unowned ground alone', () => {
    const free: Cell = { h3: 'a', ownerId: null, strength: 0, lastVisitedAt: 0, visitDays: [] };
    expect(projectCell(free, days(1000))).toEqual(free);
  });
});

describe('projection, not state', () => {
  it('never advances lastVisitedAt', () => {
    // Advancing it would hand out a fresh grace period on every read, and a cell that
    // is looked at often enough would never decay at all.
    expect(projectCell(cell(400), days(10))?.lastVisitedAt).toBe(T0);
  });

  it('is a pure function of the stored cell and the clock', () => {
    expect(projectCell(cell(400), days(10))).toEqual(projectCell(cell(400), days(10)));
  });

  it('charges twice if a projection is projected again — so never persist one', () => {
    // Documenting the hazard rather than papering over it. Decay is measured from the
    // true last visit; feeding a projection back in counts the same days a second time.
    const once = projectCell(cell(400), days(10)) as Cell;
    const twice = projectCell(once, days(10)) as Cell;
    expect(twice.strength).toBeLessThan(once.strength);
  });

  it('leaves the input untouched', () => {
    const original = cell(400);
    const snapshot = structuredClone(original);
    projectCell(original, days(10));
    expect(original).toEqual(snapshot);
  });
});

describe('hoursUntilReleased', () => {
  it('is zero for a cell already gone', () => {
    expect(hoursUntilReleased(0)).toBe(0);
    expect(hoursUntilReleased(-10)).toBe(0);
  });

  it('agrees with projectCell', () => {
    for (const strength of [50, 100, 250, 400, MAX_STRENGTH]) {
      const deadline = hoursUntilReleased(strength);
      expect(projectCell(cell(strength), hours(deadline - 1))).not.toBeNull();
      expect(projectCell(cell(strength), hours(deadline + 1))).toBeNull();
    }
  });

  it('grows with strength', () => {
    expect(hoursUntilReleased(MAX_STRENGTH)).toBeGreaterThan(hoursUntilReleased(BASE_STRENGTH));
  });
});

describe('sweepDecay', () => {
  it('separates what survived from what was lost', () => {
    const cells = [cell(MAX_STRENGTH, 'strong'), cell(BASE_STRENGTH, 'weak'), cell(300, 'mid')];
    const sweep = sweepDecay(cells, days(20));

    expect(sweep.released).toEqual(['weak']);
    expect(sweep.cells.map((c) => c.h3).sort()).toEqual(['mid', 'strong']);
    expect(sweep.weakened.sort()).toEqual(['mid', 'strong']);
  });

  it('reports nothing weakened inside the grace period', () => {
    const sweep = sweepDecay([cell(300)], hours(1));
    expect(sweep).toEqual({ cells: [cell(300)], weakened: [], released: [] });
  });

  it('handles an empty set', () => {
    expect(sweepDecay([], days(100))).toEqual({ cells: [], weakened: [], released: [] });
  });
});

describe('imported cells do not decay (BRDC-SHARE-001)', () => {
  const fromWorld: Cell = {
    h3: 'w',
    ownerId: 'someone-else',
    strength: 120,
    lastVisitedAt: T0,
    visitDays: [],
    imported: true,
  };

  it('projectCell returns it unchanged a month on', () => {
    expect(projectCell(fromWorld, days(30))).toEqual(fromWorld);
  });

  it('sweepDecay never weakens or releases it', () => {
    const sweep = sweepDecay([fromWorld], days(90));
    expect(sweep).toEqual({ cells: [fromWorld], weakened: [], released: [] });
  });
});
