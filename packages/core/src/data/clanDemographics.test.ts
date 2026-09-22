/**
 * BRDC-CLAN-002 — folding clan members into one synthetic realm each.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { demographicsOf } from './demographics.js';
import { clanMeasurables } from './clanDemographics.js';
import type { WorldSource } from './world.js';

const T0 = Date.parse('2026-09-22T12:00:00Z');
const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });
const RING = neighboursOf(HOME);

const source = (id: string, over: Partial<WorldSource> = {}): WorldSource => ({
  id,
  name: id,
  castle: HOME,
  cells: [{ h3: HOME, strength: 300 }],
  ...over,
});

describe('clanMeasurables', () => {
  it('sums a clan of two into one realm, cells and ley-line both', () => {
    const a = source('a', { clanId: 'WYRM42', leyM: 40 });
    const b = source('b', {
      clanId: 'WYRM42',
      leyM: 60,
      cells: RING.slice(0, 2).map((h3) => ({ h3, strength: 300 })),
    });
    const [clan] = clanMeasurables([a, b]);

    expect(clan?.id).toBe('WYRM42');
    expect(clan?.cells).toHaveLength(3); // a's one cell + b's two
    expect(clan?.leyM).toBe(100);
  });

  it("uses the clan's highest level, never a sum", () => {
    const a = source('a', { clanId: 'WYRM42', level: 3 });
    const b = source('b', { clanId: 'WYRM42', level: 9 });
    const [clan] = clanMeasurables([a, b]);
    expect(clan?.level).toBe(9);
  });

  it('floors a missing level at 1, same as demographicsOf does for a player', () => {
    const a = source('a', { clanId: 'WYRM42' });
    const [clan] = clanMeasurables([a]);
    expect(clan?.level).toBe(1);
  });

  it('keeps two clans apart, and a player with no clan joins neither', () => {
    const a = source('a', { clanId: 'WYRM42' });
    const b = source('b', { clanId: 'ROOK99' });
    const nobody = source('c');
    const clans = clanMeasurables([a, b, nobody]);

    expect(clans.map((c) => c.id).sort()).toEqual(['ROOK99', 'WYRM42']);
    expect(clans).toHaveLength(2);
  });

  it('is empty, not an error, when nobody has a clan', () => {
    expect(clanMeasurables([source('a'), source('b')])).toEqual([]);
  });

  it('is empty for an empty input', () => {
    expect(clanMeasurables([])).toEqual([]);
  });

  it('feeds demographicsOf and produces the same Metric shape a player table does', () => {
    const a = source('a', { clanId: 'WYRM42' });
    const b = source('b', { clanId: 'ROOK99', cells: RING.map((h3) => ({ h3, strength: 300 })) });
    const table = demographicsOf(clanMeasurables([a, b]), T0);

    expect(table.players).toBe(2);
    const land = table.metrics.find((m) => m.id === 'land');
    expect(land?.ranked[0]?.id).toBe('ROOK99'); // six cells beats one
  });
});
