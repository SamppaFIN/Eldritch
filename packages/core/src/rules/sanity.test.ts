import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { staffKey } from './staffing.js';
import { realmSanity, sanityWord, sanityYield } from './sanity.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 4);
const cells = (n: number): Cell[] =>
  hexes.slice(0, n).map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] }));

describe('realm sanity', () => {
  it('10, minus crowding past six citizens, minus a point per eight cells', () => {
    expect(realmSanity(cells(0), {}, 6)).toBe(10);
    expect(realmSanity(cells(16), {}, 6)).toBe(8);
    expect(realmSanity(cells(0), {}, 16)).toBe(0);
    expect(realmSanity(cells(0), {}, 6, 2)).toBe(6);
  });

  it('a staffed Temple Grove adds 2, a staffed Tavern 3; unstaffed ones nothing', () => {
    const [a, b] = cells(2) as [Cell, Cell];
    const realm = [
      { ...a, buildings: [{ id: 'temple-grove' as const, builtAt: T0 }] },
      { ...b, buildings: [{ id: 'tavern' as const, builtAt: T0 }] },
    ];
    expect(realmSanity(realm, {}, 6)).toBe(9);
    const staff = { [staffKey(a.h3, 'temple-grove')]: 1, [staffKey(b.h3, 'tavern')]: 1 };
    expect(realmSanity(realm, staff, 6)).toBe(14);
  });

  it('says it in a word, and a mad realm works at four fifths', () => {
    expect([12, 3, -1, -11].map(sanityWord)).toEqual(['calm', 'uneasy', 'mad', 'breaking']);
    expect(sanityYield(0)).toBe(1);
    expect(sanityYield(-1)).toBe(0.8);
  });
});
