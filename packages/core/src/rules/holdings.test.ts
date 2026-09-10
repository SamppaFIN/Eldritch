/**
 * BRDC-LANDS-001 — the ledger of held ground, and the order it is read in.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { holdingOf, sortHoldings, summarise } from './holdings.js';
import type { Holding } from './holdings.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-10T12:00:00Z');
const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });
const [A, B, C] = neighboursOf(HOME) as [string, string, string];

const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});

const holding = (over: Partial<Holding> = {}): Holding => ({
  h3: 'x',
  terrain: 'plain',
  resource: null,
  strength: 300,
  hoursLeft: 100,
  days: 0,
  work: null,
  revealed: true,
  home: false,
  ...over,
});

describe('holdingOf', () => {
  it('reads the ground, the Work and whether it has been revealed', () => {
    const h = holdingOf(cell(A, { buildings: [{ id: 'mine', builtAt: T0 }], ownedDays: 4 }), { [A]: T0 }, HOME);
    expect(h.work).toBe('mine');
    expect(h.days).toBe(4);
    expect(h.revealed).toBe(true);
    expect(h.home).toBe(false);
  });

  /*
   * The Hearth cannot be lost (BRDC-HEARTH-002) and neither can imported ground, which
   * this device never witnesses. A countdown on either would be a lie with a number on it.
   */
  it('gives no countdown to ground that cannot be lost', () => {
    expect(holdingOf(cell(HOME), {}, HOME).hoursLeft).toBeNull();
    expect(holdingOf(cell(A, { imported: true }), {}, HOME).hoursLeft).toBeNull();
    expect(holdingOf(cell(A), {}, HOME).hoursLeft).toBeGreaterThan(0);
  });

  it('marks the Hearth as the Hearth', () => {
    expect(holdingOf(cell(HOME), {}, HOME).home).toBe(true);
  });
});

describe('sortHoldings', () => {
  // Revealing is free, pays every time, and is the only thing on this list that can be
  // done without walking anywhere. Infinite asked for exactly this order.
  it('puts unrevealed ground first, whatever its state', () => {
    const list = sortHoldings([
      holding({ h3: 'seen', revealed: true, hoursLeft: 1 }),
      holding({ h3: 'unseen', revealed: false, hoursLeft: 900 }),
    ]);
    expect(list.map((h) => h.h3)).toEqual(['unseen', 'seen']);
  });

  it('then the closest to being lost', () => {
    const list = sortHoldings([
      holding({ h3: 'safe', hoursLeft: 500 }),
      holding({ h3: 'soon', hoursLeft: 6 }),
      holding({ h3: 'later', hoursLeft: 90 }),
    ]);
    expect(list.map((h) => h.h3)).toEqual(['soon', 'later', 'safe']);
  });

  it('sinks ground that cannot be lost to the bottom — it is doing fine', () => {
    const list = sortHoldings([
      holding({ h3: 'hearth', hoursLeft: null }),
      holding({ h3: 'fading', hoursLeft: 3 }),
    ]);
    expect(list.map((h) => h.h3)).toEqual(['fading', 'hearth']);
  });

  it('breaks a tie the same way every time, so the list does not shuffle under a thumb', () => {
    const twice = () => sortHoldings([holding({ h3: B }), holding({ h3: A }), holding({ h3: C })]);
    expect(twice().map((h) => h.h3)).toEqual(twice().map((h) => h.h3));
  });

  it('leaves the list it was given alone', () => {
    const given = [holding({ h3: 'b', hoursLeft: 9 }), holding({ h3: 'a', hoursLeft: 1 })];
    sortHoldings(given);
    expect(given[0]?.h3).toBe('b');
  });
});

describe('summarise', () => {
  it('counts what the heading has to say', () => {
    const s = summarise([
      holding({ revealed: false }),
      holding({ revealed: true, work: 'mine' }),
      holding({ revealed: true, hoursLeft: 5 }),
      holding({ revealed: true, hoursLeft: null }),
    ]);
    expect(s).toEqual({ total: 4, unrevealed: 1, works: 1, fading: 1 });
  });

  it('counts nothing out of nothing', () => {
    expect(summarise([])).toEqual({ total: 0, unrevealed: 0, works: 0, fading: 0 });
  });
});
