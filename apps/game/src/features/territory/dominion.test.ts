import { describe, expect, it } from 'vitest';
import { TRICKLE_PER_HOUR, cellAt, destination, resourceOf } from '@es3/core';
import type { Cell } from '@es3/core';
import { dominionOf } from './dominion.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-29T12:00:00Z');
const HOUR = 3_600_000;
const ME = 'me';

/** Real H3 indexes spread over a few hundred metres, so terrain is real too. */
function ground(count: number, strength = 200, lastVisitedAt = T0): Cell[] {
  return Array.from({ length: count }, (_, i) => ({
    h3: cellAt(destination(ORIGIN, (i * 47) % 360, 30 + i * 35)),
    ownerId: ME,
    strength,
    lastVisitedAt,
    visitDays: [],
  }));
}

describe('dominionOf', () => {
  it('says nothing is held when nothing is held', () => {
    const d = dominionOf([], T0);
    expect(d).toMatchObject({ cells: 0, areaM2: 0, strongest: 0, weakest: null, atRisk: 0 });
    expect(d.firstLossInHours).toBeNull();
  });

  it('counts ground and measures it from the cells themselves', () => {
    const d = dominionOf(ground(12), T0);
    expect(d.cells).toBe(12);
    // Never from the nominal cell area: at 61°N a res-11 cell is 1622 m², not 2150.
    expect(d.areaM2).toBeGreaterThan(12 * 1_000);
    expect(d.areaM2).toBeLessThan(12 * 2_150);
  });

  it('reports the strongest cell held', () => {
    const cells = [...ground(3, 120), ...ground(1, 480)];
    expect(dominionOf(cells, T0).strongest).toBe(480);
  });

  it('names the cell closest to being lost, not the weakest one', () => {
    /*
     * These are different questions. A strong cell nobody has walked in three weeks is
     * closer to the Void than a fresh weak one, and it is the first that the player has
     * to be told about.
     */
    const [fresh, staleCell] = ground(2, 100);
    const stale = { ...(staleCell as Cell), strength: 400, lastVisitedAt: T0 - 25 * 24 * HOUR };

    const d = dominionOf([fresh as Cell, stale], T0);
    expect(d.weakest?.h3).toBe(stale.h3);
  });

  it('counts what is within a day of the Void', () => {
    // Three real cells, one of them left alone for eleven days at base strength.
    const [a, b, c] = ground(3, 400);
    const doomed = { ...(c as Cell), strength: 100, lastVisitedAt: T0 - 11 * 24 * HOUR };
    expect(dominionOf([a as Cell, b as Cell, doomed], T0).atRisk).toBe(1);
  });

  it('rates production from the ground that actually produces', () => {
    const cells = ground(30);
    const d = dominionOf(cells, T0);

    const wood = cells.filter((c) => resourceOf(c.h3) === 'wood').length;
    expect(d.producing.wood).toBe(wood);
    expect(d.perHour.wood).toBe(wood * TRICKLE_PER_HOUR);
  });

  it('pays nothing per hour for plain ground', () => {
    const plain = ground(30).filter((c) => resourceOf(c.h3) === null);
    const d = dominionOf(plain, T0);
    expect(Object.values(d.perHour).every((v) => v === 0)).toBe(true);
    expect(d.resting).toBe(0);
  });

  it('counts a producing cell gone quiet as resting, not producing', () => {
    // BRDC-ECON-001: a cell not visited within the grace window earns nothing, and the
    // HUD must say so rather than claim a rate the pouch is not actually being paid.
    const cells = ground(30);
    const wood = cells.find((c) => resourceOf(c.h3) === 'wood') as Cell;
    const stale = { ...wood, lastVisitedAt: T0 - 60 * HOUR };
    const others = cells.filter((c) => c.h3 !== wood.h3);

    const awake = dominionOf(cells, T0);
    const gone = dominionOf([...others, stale], T0);

    expect(gone.producing.wood).toBe(awake.producing.wood - 1);
    expect(gone.resting).toBe(awake.resting + 1);
  });
});
