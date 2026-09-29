import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { MASTERWORKS, activeMasterworks, isDormant, ladder } from './masterwork.js';
import type { BuildingId, Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const ring = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 2);
const at = (i: number, id: BuildingId): Cell => ({
  h3: ring[i] as string,
  ownerId: 'me',
  strength: 100,
  lastVisitedAt: T0,
  visitDays: [],
  buildings: [{ id, builtAt: T0 }],
});
const towers = (k: number) => Array.from({ length: k }, (_, i) => at(i, 'watchtower'));

describe('masterworks — count + Lore + level', () => {
  it('the Fortress ladder: five towers, one at level 3, Signal Fires', () => {
    const four = ladder('fortress', towers(4), [], () => 3);
    expect(four.needs.map((n) => n.met)).toEqual([false, true, false]);
    const five = ladder('fortress', towers(5), ['signal-fires'], (c) => (c.h3 === ring[2] ? 3 : 1));
    expect(five.needs.every((n) => n.met)).toBe(true);
    expect(five.host?.h3).toBe(ring[2]);
  });

  it('no host until one is levelled', () => {
    expect(ladder('fortress', towers(5), ['signal-fires'], () => 2).host).toBeNull();
  });

  it('dormant when the count drops below the threshold; the masterwork counts as its host', () => {
    const raised = [...towers(4), at(4, 'fortress')];
    expect(isDormant('fortress', raised)).toBe(false);
    expect(activeMasterworks(raised)).toEqual(['fortress']);
    const lost = [...towers(3), at(4, 'fortress')];
    expect(isDormant('fortress', lost)).toBe(true);
    expect(activeMasterworks(lost)).toEqual([]);
  });

  it('the Foundry wants two kinds of work', () => {
    expect(Object.keys(MASTERWORKS.foundry.count)).toEqual(['quarry', 'forge']);
  });
});
