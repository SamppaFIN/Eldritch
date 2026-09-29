import { describe, expect, it } from 'vitest';
import { hallOfAges, hallOfRecords, legacyBoard } from './boards.js';
import { EMPTY_COUNTS } from './legacy.js';
import type { BoardRow } from './boards.js';

const row = (realm: string, legacy: number, over: Partial<typeof EMPTY_COUNTS> = {}): BoardRow => ({
  realm, name: realm.toUpperCase(), legacy, counts: { ...EMPTY_COUNTS, ...over },
});

describe('the season boards (BRDC-SEASON-005)', () => {
  it('ranks by Legacy', () => {
    expect(legacyBoard([row('a', 10), row('b', 90), row('c', 40)]).map((r) => r.realm)).toEqual(['b', 'c', 'a']);
  });

  it('gives seven titles, one holder each; a mid-ranked realm can hold one', () => {
    const rows = [row('top', 900, { cells: 140, damage: 3000 }), row('mid', 200, { gatesSealed: 9, sanity: 22 })];
    const titles = hallOfRecords(rows);
    expect(titles).toHaveLength(7);
    const by = Object.fromEntries(titles.map((t) => [t.id, t.holder?.realm ?? null]));
    expect(by).toMatchObject({ unsleeping: 'top', 'wide-reach': 'top', 'warden-of-doors': 'mid', 'sane-among-the-mad': 'mid', 'mother-of-multitudes': null });
  });

  it('the Hall of Ages sums the best three seasons', () => {
    const seasons = [[row('a', 100)], [row('a', 50), row('b', 400)], [row('a', 300)], [row('a', 200)]];
    expect(hallOfAges(seasons)).toEqual([{ realm: 'a', name: 'A', score: 600 }, { realm: 'b', name: 'B', score: 400 }]);
  });
});
