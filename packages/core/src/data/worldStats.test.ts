/**
 * BRDC-ATLAS-001 — rolling res-11 ground up to res-5 municipalities, one dominant
 * holder each.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, nationRegionOf, neighboursOf } from '../geo/cells.js';
import { atlasOf } from './worldStats.js';
import type { WorldSource } from './world.js';

const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });
const RING = neighboursOf(HOME);
// Genuinely far — a different res-5 municipality from HOME's, not just a neighbour.
const FAR = cellAt({ lat: 65.0121, lng: 25.4651 });

const source = (id: string, cells: string[], over: Partial<WorldSource> = {}): WorldSource => ({
  id,
  name: id,
  castle: cells[0] ?? null,
  cells: cells.map((h3) => ({ h3, strength: 200 })),
  ...over,
});

describe('atlasOf', () => {
  it('is empty for no sources, or sources with no cells', () => {
    expect(atlasOf([])).toEqual([]);
    expect(atlasOf([source('a', [])])).toEqual([]);
  });

  it('rolls a region up to whoever holds the most of it', () => {
    const a = source('a', [HOME]);
    const b = source('b', RING.slice(0, 3));
    const [region] = atlasOf([a, b]);

    expect(region?.region).toBe(nationRegionOf(HOME));
    expect(region?.dominant.id).toBe('b'); // three cells beats one
    expect(region?.players).toBe(2);
  });

  it('keeps two distant municipalities apart', () => {
    const a = source('a', [HOME]);
    const b = source('b', [FAR]);
    const regions = atlasOf([a, b]);

    expect(regions).toHaveLength(2);
    expect(nationRegionOf(HOME)).not.toBe(nationRegionOf(FAR));
    expect(regions.map((r) => r.dominant.id).sort()).toEqual(['a', 'b']);
  });

  it("carries the dominant holder's nation and banner when set", () => {
    const a = source('a', [HOME], { nation: 'The Pale March', banner: 'eye' });
    const [region] = atlasOf([a]);
    expect(region?.dominant.nation).toBe('The Pale March');
    expect(region?.dominant.banner).toBe('eye');
  });

  it('omits nation and banner when the source carried none', () => {
    const [region] = atlasOf([source('a', [HOME])]);
    expect('nation' in (region?.dominant ?? {})).toBe(false);
    expect('banner' in (region?.dominant ?? {})).toBe(false);
  });

  it('is one player alone, with no rival to compare against', () => {
    const [region] = atlasOf([source('a', [HOME, ...RING])]);
    expect(region?.players).toBe(1);
    expect(region?.dominant.id).toBe('a');
  });
});
