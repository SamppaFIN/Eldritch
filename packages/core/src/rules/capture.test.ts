import { describe, expect, it } from 'vitest';
import type { Cell } from '../types/domain.js';
import { attackPower, emptyCell, resolveCapture } from './capture.js';
import {
  BASE_STRENGTH,
  DAY_VISIT_BONUS,
  LEVEL_STRENGTH_BONUS,
  MAX_STRENGTH,
  NEIGHBOUR_BONUS,
  NEIGHBOUR_BONUS_CAP,
  STREAK_VISIT_BONUS,
} from './constants.js';
import { previousDay, utcDay } from './day.js';

const H3 = '8b088a2dab1cfff';
const ME = { id: 'me', level: 1 };
const RIVAL = 'the-pale-warden';

/** Noon UTC, so a test never straddles midnight by accident. */
const DAY = (n: number) => Date.parse('2026-08-27T12:00:00Z') + n * 86_400_000;

function ownedBy(owner: string, strength: number, visitedAt: number, days: string[] = []): Cell {
  return { h3: H3, ownerId: owner, strength, lastVisitedAt: visitedAt, visitDays: days };
}

describe('attackPower', () => {
  it('is the base plus level', () => {
    expect(attackPower({ id: 'me', level: 0 })).toBe(BASE_STRENGTH);
    expect(attackPower({ id: 'me', level: 10 })).toBe(BASE_STRENGTH + 10 * LEVEL_STRENGTH_BONUS);
  });

  it('adds a bonus per owned neighbour', () => {
    expect(attackPower({ ...ME, ownedNeighbours: 2 })).toBe(
      attackPower(ME) + 2 * NEIGHBOUR_BONUS,
    );
  });

  it('caps the neighbour bonus', () => {
    // Six neighbours would be 90; anything beyond must not keep paying, or a large
    // contiguous territory would flip its whole border in a single pass.
    expect(attackPower({ ...ME, ownedNeighbours: 6 })).toBe(attackPower(ME) + NEIGHBOUR_BONUS_CAP);
    expect(attackPower({ ...ME, ownedNeighbours: 60 })).toBe(
      attackPower({ ...ME, ownedNeighbours: 6 }),
    );
  });

  it('cannot be dragged down by nonsense', () => {
    expect(attackPower({ id: 'me', level: -5, ownedNeighbours: -3 })).toBe(BASE_STRENGTH);
  });

  it('stays below a maxed defence without an anchor', () => {
    // The siege model only means anything if one pass cannot take a strong cell.
    expect(attackPower({ id: 'me', level: 20, ownedNeighbours: 6 })).toBeLessThan(MAX_STRENGTH);
  });
});

describe('claiming unowned ground', () => {
  it('takes it at base strength', () => {
    const { cell, outcome } = resolveCapture(emptyCell(H3), ME, DAY(0));
    expect(outcome.kind).toBe('claimed');
    expect(cell.ownerId).toBe('me');
    expect(cell.strength).toBe(BASE_STRENGTH);
    expect(cell.visitDays).toEqual([utcDay(DAY(0))]);
  });

  it('records who had it before, which is nobody', () => {
    expect(resolveCapture(emptyCell(H3), ME, DAY(0)).outcome.previousOwner).toBeNull();
  });
});

describe('reinforcement is per calendar day', () => {
  it('pays on the first pass of a new day', () => {
    const cell = ownedBy('me', 100, DAY(-1), [utcDay(DAY(-3))]);
    const { cell: after, outcome } = resolveCapture(cell, ME, DAY(0));
    expect(outcome.kind).toBe('reinforced');
    expect(after.strength).toBe(100 + DAY_VISIT_BONUS);
  });

  it('pays nothing on the second pass of the same day', () => {
    const cell = ownedBy('me', 125, DAY(0), [utcDay(DAY(0))]);
    const { cell: after, outcome } = resolveCapture(cell, ME, DAY(0) + 3_600_000);
    expect(outcome.kind).toBe('unchanged');
    expect(after.strength).toBe(125);
  });

  it('still counts the second pass as a visit, for decay', () => {
    // No strength, but being here must keep the cell alive — otherwise an afternoon
    // lap would leave a cell to rot as though nobody had walked it.
    const cell = ownedBy('me', 125, DAY(0), [utcDay(DAY(0))]);
    const later = DAY(0) + 3_600_000;
    expect(resolveCapture(cell, ME, later).cell.lastVisitedAt).toBe(later);
  });

  it('pays double when yesterday counted too', () => {
    const cell = ownedBy('me', 100, DAY(-1), [utcDay(DAY(-1))]);
    const { cell: after } = resolveCapture(cell, ME, DAY(0));
    expect(after.strength).toBe(100 + STREAK_VISIT_BONUS);
  });

  it('breaks the streak after a day off', () => {
    const cell = ownedBy('me', 100, DAY(-2), [utcDay(DAY(-2))]);
    const { cell: after } = resolveCapture(cell, ME, DAY(0));
    expect(after.strength).toBe(100 + DAY_VISIT_BONUS);
  });

  it('caps at MAX_STRENGTH', () => {
    const cell = ownedBy('me', MAX_STRENGTH - 10, DAY(-1), [utcDay(DAY(-1))]);
    expect(resolveCapture(cell, ME, DAY(0)).cell.strength).toBe(MAX_STRENGTH);
  });

  it('keeps only yesterday and today, so history cannot grow forever', () => {
    // A commute walked for a year would otherwise accumulate 365 strings per cell.
    const old = Array.from({ length: 40 }, (_, i) => utcDay(DAY(-40 + i)));
    const cell = ownedBy('me', 200, DAY(-1), old);
    const { cell: after } = resolveCapture(cell, ME, DAY(0));

    expect(after.visitDays.length).toBeLessThanOrEqual(2);
    expect(after.visitDays).toContain(utcDay(DAY(0)));
    expect(after.visitDays).toContain(previousDay(utcDay(DAY(0))));
  });

  it('reaches the cap in about two weeks of daily walking', () => {
    // The tempo claim from MASTERPLAN §2.1, asserted rather than assumed.
    let cell = ownedBy('me', BASE_STRENGTH, DAY(0), [utcDay(DAY(0))]);
    let day = 1;
    while (cell.strength < MAX_STRENGTH && day < 60) {
      cell = resolveCapture(cell, ME, DAY(day)).cell;
      day++;
    }
    expect(day).toBeGreaterThan(7);
    expect(day).toBeLessThan(16);
  });
});

describe('siege — an enemy cell does not flip in one pass', () => {
  it('damages a strong cell without taking it', () => {
    const cell = ownedBy(RIVAL, MAX_STRENGTH, DAY(0));
    const { cell: after, outcome } = resolveCapture(cell, ME, DAY(1));

    expect(outcome.kind).toBe('damaged');
    expect(after.ownerId).toBe(RIVAL);
    expect(after.strength).toBe(MAX_STRENGTH - attackPower(ME));
  });

  it('does not shelter the cell from decay while attacking it', () => {
    // The defender was not here. Advancing lastVisitedAt would mean besieging a
    // cell kept it alive for its owner, which is exactly backwards.
    const cell = ownedBy(RIVAL, MAX_STRENGTH, DAY(0));
    expect(resolveCapture(cell, ME, DAY(5)).cell.lastVisitedAt).toBe(DAY(0));
  });

  it('takes it when the strength runs out, and resets it', () => {
    const cell = ownedBy(RIVAL, 50, DAY(0));
    const { cell: after, outcome } = resolveCapture(cell, ME, DAY(1));

    expect(outcome.kind).toBe('taken');
    expect(outcome.previousOwner).toBe(RIVAL);
    expect(after.ownerId).toBe('me');
    expect(after.strength).toBe(BASE_STRENGTH);
    expect(after.visitDays).toEqual([utcDay(DAY(1))]);
  });

  it('needs several separate walks to take an established home block', () => {
    // The locked decision from MASTERPLAN §2.2: a maxed cell must not fall to one
    // visit, and must not need a dozen either.
    let cell = ownedBy(RIVAL, MAX_STRENGTH, DAY(0));
    let passes = 0;

    while (cell.ownerId === RIVAL && passes < 20) {
      passes++;
      cell = resolveCapture(cell, ME, DAY(passes)).cell;
    }

    expect(passes).toBeGreaterThanOrEqual(2);
    expect(passes).toBeLessThanOrEqual(5);
  });

  it('falls faster to an attacker who owns the ground around it', () => {
    const start = () => ownedBy(RIVAL, MAX_STRENGTH, DAY(0));
    const alone = resolveCapture(start(), ME, DAY(1)).cell.strength;
    const surrounded = resolveCapture(start(), { ...ME, ownedNeighbours: 6 }, DAY(1)).cell.strength;
    expect(surrounded).toBeLessThan(alone);
  });

  it('does not simplify to a single comparison', () => {
    // Guarding the rule itself: attack power greater than strength must still not
    // flip a cell in one pass unless the strength actually reaches zero.
    const cell = ownedBy(RIVAL, attackPower(ME) + 1, DAY(0));
    expect(resolveCapture(cell, ME, DAY(1)).outcome.kind).toBe('damaged');
  });
});

describe('outcomes report both sides of the change', () => {
  it('carries strength before and after', () => {
    const cell = ownedBy(RIVAL, 300, DAY(0));
    const { outcome } = resolveCapture(cell, ME, DAY(1));
    expect(outcome.strengthBefore).toBe(300);
    expect(outcome.strengthAfter).toBe(300 - attackPower(ME));
  });

  it('never mutates the cell it was given', () => {
    const cell = ownedBy(RIVAL, 300, DAY(0));
    const snapshot = structuredClone(cell);
    resolveCapture(cell, ME, DAY(1));
    expect(cell).toEqual(snapshot);
  });
});
