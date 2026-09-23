import { describe, expect, it } from 'vitest';
import { seasonDayKey, seasonStandingsOf } from './seasonStats.js';
import type { WorldSource } from './world.js';

function source(id: string, cells: number, extra: Partial<WorldSource> = {}): WorldSource {
  return {
    id,
    name: id,
    castle: null,
    cells: Array.from({ length: cells }, (_, i) => ({ h3: `h3-${id}-${i}`, strength: 100 })),
    ...extra,
  };
}

describe('seasonStandingsOf (BRDC-SEASON-001)', () => {
  it('reads routeDistanceM for a Route-mode source', () => {
    const [s] = seasonStandingsOf([source('a', 3, { routeDistanceM: 1_234.6 })]);
    expect(s).toEqual({ id: 'a', name: 'a', distanceM: 1_235, hexes: 3 });
  });

  it('falls back to leyM for an Adventure-mode source with no routeDistanceM', () => {
    const [s] = seasonStandingsOf([source('a', 5, { leyM: 800.4 })]);
    expect(s).toEqual({ id: 'a', name: 'a', distanceM: 800, hexes: 5 });
  });

  it('reads zero distance for a source with neither field', () => {
    const [s] = seasonStandingsOf([source('a', 2)]);
    expect(s?.distanceM).toBe(0);
  });

  it('prefers routeDistanceM over leyM when a source somehow carries both', () => {
    const [s] = seasonStandingsOf([source('a', 1, { routeDistanceM: 500, leyM: 999 })]);
    expect(s?.distanceM).toBe(500);
  });

  it('is empty for no sources', () => {
    expect(seasonStandingsOf([])).toEqual([]);
  });
});

describe('seasonDayKey (BRDC-SEASON-001)', () => {
  it('is stable within the same day', () => {
    const morning = seasonDayKey(Date.UTC(2026, 8, 23, 2));
    const evening = seasonDayKey(Date.UTC(2026, 8, 23, 23));
    expect(morning).toBe(evening);
  });

  it('changes across a day boundary', () => {
    const day1 = seasonDayKey(Date.UTC(2026, 8, 23, 23, 59));
    const day2 = seasonDayKey(Date.UTC(2026, 8, 24, 0, 1));
    expect(day1).not.toBe(day2);
  });
});
