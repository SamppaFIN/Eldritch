/** BRDC-GREAT-001 — great people: the rate, the cost and the names. */
import { describe, expect, it } from 'vitest';
import { GREAT, greatCost, greatName, greatRate } from './greatPeople.js';
import { staffKey } from './staffing.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { BuildingId, Cell } from '../types/domain.js';

const NOW = Date.parse('2026-10-08T12:00:00Z');
const H = 3_600_000;
const [A, B, C, D] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 1) as [string, string, string, string];
const cell = (h3: string, work: BuildingId, seen = NOW - H): Cell => ({
  h3, ownerId: 'me', strength: 100, lastVisitedAt: seen, visitDays: [], buildings: [{ id: work, builtAt: 0 }],
});

describe('greatRate', () => {
  it('one point an hour per gathering Work on awake ground', () => {
    const owned = [cell(A, 'library'), cell(B, 'library'), cell(C, 'market'), cell(D, 'temple-grove', NOW - 100 * H)];
    expect(greatRate(owned, NOW, null)).toEqual({ scholar: 2, merchant: 1, mystic: 0 });
  });
  it('on a Season 2 realm only a Work with hands in it gathers', () => {
    const owned = [cell(A, 'library'), cell(B, 'library')];
    expect(greatRate(owned, NOW, { [staffKey(A, 'library')]: 1 }).scholar).toBe(1);
  });
});

describe('greatCost and greatName', () => {
  it('the first at 100, each next half again more', () => {
    expect([greatCost(0), greatCost(1), greatCost(2)]).toEqual([100, 150, 200]);
  });
  it('names come from the lake’s own people, numbered once they run out', () => {
    expect(greatName('scholar', 0)).toBe(GREAT.scholar.names[0]);
    expect(greatName('scholar', GREAT.scholar.names.length)).toBe(`${GREAT.scholar.names[0]} II`);
  });
});
