/**
 * BRDC-CODEX-001 — the Codex of Dominion measures every realm against every other.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { POP_PER_BUILDING, POP_PER_CELL } from '../rules/constants.js';
import { METRIC_IDS, demographicsOf, placementIn } from './demographics.js';
import type { Measurable, MetricId } from './demographics.js';

const T0 = Date.parse('2026-09-10T12:00:00Z');
const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });
const RING = neighboursOf(HOME);
const AWAY = cellAt({ lat: 61.9, lng: 25.6 });

const realm = (id: string, over: Partial<Measurable> = {}): Measurable => ({
  id,
  name: id,
  cells: [{ h3: HOME, strength: 300 }],
  ...over,
});

const metric = (realms: Measurable[], id: MetricId) => {
  const found = demographicsOf(realms, T0).metrics.find((m) => m.id === id);
  if (!found) throw new Error(`no metric ${id}`);
  return found;
};

describe('demographicsOf', () => {
  it('measures every realm on every row — a table, not a scoreboard', () => {
    const table = demographicsOf([realm('a'), realm('b')], T0);
    expect(table.players).toBe(2);
    expect(table.metrics.map((m) => m.id)).toEqual(METRIC_IDS);
    for (const m of table.metrics) expect(m.ranked).toHaveLength(2);
  });

  it('ranks best first and reports best, worst and the mean', () => {
    const big = realm('big', { cells: [HOME, ...RING].map((h3) => ({ h3, strength: 300 })) });
    const small = realm('small');
    const m = metric([small, big], 'land');

    expect(m.ranked[0]?.id).toBe('big');
    expect(m.best).toBe(m.ranked[0]?.value);
    expect(m.worst).toBe(m.ranked[1]?.value);
    expect(m.average).toBeCloseTo((m.best + m.worst) / 2, 6);
  });

  /*
   * The reason `level` and `leyM` read as their floor rather than being skipped: a realm
   * that appeared in one row and not another would make the ranks disagree — "3 of 7" on
   * one line and "3 of 5" on the next, from the same table.
   */
  it('gives every row the same population, even for a realm from before these fields', () => {
    const table = demographicsOf([realm('old'), realm('new', { level: 8, leyM: 4_000 })], T0);
    for (const m of table.metrics) expect(m.ranked).toHaveLength(2);
    expect(metric([realm('old')], 'consciousness').ranked[0]?.value).toBe(1);
    expect(metric([realm('old')], 'leyline').ranked[0]?.value).toBe(0);
  });

  it('counts provinces as distinct regions, not as cells', () => {
    const spread = realm('spread', {
      cells: [HOME, RING[0] as string, AWAY].map((h3) => ({ h3, strength: 300 })),
    });
    // Two of the three hexes are neighbours, so they share a res-6 region.
    expect(metric([spread], 'provinces').ranked[0]?.value).toBe(2);
  });

  it('counts every Work on every cell', () => {
    const built = realm('built', {
      cells: [
        { h3: HOME, strength: 300, b: ['mine'] },
        { h3: RING[0] as string, strength: 300, b: ['sawmill'] },
        { h3: RING[1] as string, strength: 300 },
      ],
    });
    expect(metric([built], 'works').ranked[0]?.value).toBe(2);
  });

  it('reads population off the ground and what stands on it', () => {
    const built = realm('built', { cells: [{ h3: HOME, strength: 300, b: ['mine'] }] });
    expect(metric([built], 'population').ranked[0]?.value).toBe(POP_PER_CELL + POP_PER_BUILDING);
  });

  // Footfall is the one measure an afternoon cannot buy: it only grows by coming back.
  it('adds up the days walked across every held hex', () => {
    const loyal = realm('loyal', {
      cells: [
        { h3: HOME, strength: 300, d: 12 },
        { h3: RING[0] as string, strength: 300, d: 3 },
      ],
    });
    expect(metric([loyal], 'footfall').ranked[0]?.value).toBe(15);
  });

  it('is a table of zeroes rather than a crash when nobody has published', () => {
    const table = demographicsOf([], T0);
    expect(table.players).toBe(0);
    for (const m of table.metrics) {
      expect(m.ranked).toEqual([]);
      expect([m.best, m.worst, m.average]).toEqual([0, 0, 0]);
    }
  });
});

describe('placementIn', () => {
  it('says where one realm stands', () => {
    const m = metric([realm('a', { level: 3 }), realm('b', { level: 9 })], 'consciousness');
    expect(placementIn(m, 'b')).toEqual({ rank: 1, of: 2, value: 9 });
    expect(placementIn(m, 'a')).toEqual({ rank: 2, of: 2, value: 3 });
  });

  /*
   * Equal figures share a rank. Ranking two realms on the same number 2nd and 3rd by array
   * order would invent a difference the numbers do not contain — and the player on the
   * wrong side of it would be right to complain.
   */
  it('shares a rank between equals, and skips the one they used up', () => {
    const m = metric(
      [realm('a', { level: 5 }), realm('b', { level: 5 }), realm('c', { level: 1 })],
      'consciousness',
    );
    expect(placementIn(m, 'a')?.rank).toBe(1);
    expect(placementIn(m, 'b')?.rank).toBe(1);
    expect(placementIn(m, 'c')?.rank).toBe(3);
  });

  it('has nothing to say about a realm that is not in the table', () => {
    expect(placementIn(metric([realm('a')], 'land'), 'nobody')).toBeNull();
  });
});
