/** BRDC-AMBITION-001 — the season's ambition, read from the realm. */
import { describe, expect, it } from 'vitest';
import { AMBITIONS, ambitionMet, ambitionProgress, templesHeld } from './ambition.js';
import { legacyOf, EMPTY_COUNTS } from './legacy.js';
import type { Cell } from '../types/domain.js';

const cell = (h3: string, grove = false): Cell => ({
  h3, ownerId: 'me', strength: 100, lastVisitedAt: 0, visitDays: [], ...(grove ? { buildings: [{ id: 'temple-grove', builtAt: 0 }] } : {}),
});

describe('templesHeld', () => {
  it('counts a revealed temple on your ground and a raised Temple Grove, not a temple you do not hold', () => {
    const owned = [cell('a'), cell('b', true), cell('c')];
    expect(templesHeld(owned, ['a', 'z'])).toBe(2);
  });
});

describe('ambitionProgress', () => {
  const s = { owned: [cell('a'), cell('b', true), cell('c', true)], templePlaces: ['a'], gatesSealed: 4 };
  it('reads each ambition from the realm, capped at its need', () => {
    expect(ambitionProgress('temples', s)).toEqual({ have: 3, need: 3 });
    expect(ambitionProgress('gates', s)).toEqual({ have: 4, need: 10 });
    expect(ambitionProgress('realm', s)).toEqual({ have: 3, need: 200 });
  });
  it('is met only when the need is reached', () => {
    expect(ambitionMet('temples', s)).toBe(true);
    expect(ambitionMet('gates', s)).toBe(false);
    expect(ambitionMet('gates', { ...s, gatesSealed: 10 })).toBe(true);
  });
});

describe('the Legacy with an ambition', () => {
  const counts = { ...EMPTY_COUNTS, cells: 100 };
  it('a met ambition multiplies the Legacy by 1.15, on top of a quiet lake', () => {
    const met = legacyOf(counts, 'quiet', { title: AMBITIONS.realm.title, met: true });
    expect(met.mult).toBe(1.38);
    expect(met.total).toBe(Math.round(200 * 1.38));
    expect(met.ambition).toEqual({ title: 'Lord of the Ground', met: true });
  });
  it('an unmet ambition is shown but multiplies nothing', () => {
    const unmet = legacyOf(counts, 'risen', { title: AMBITIONS.gates.title, met: false });
    expect(unmet.mult).toBe(1);
    expect(unmet.total).toBe(200);
    expect(legacyOf(counts, 'risen').ambition).toBeUndefined();
  });
});
