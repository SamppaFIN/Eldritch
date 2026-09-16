import { describe, expect, it } from 'vitest';
import { ZONE, partitionIntoAreas } from './worldseedPartition.js';
import { cellAt, cellsWithin, neighboursOf } from '../geo/cells.js';
import type { H3Index, TerrainKind } from '../types/domain.js';

const ORIGIN = cellAt({ lat: 61.472913, lng: 23.725988 });
const noFlags = (): readonly string[] => [];

function terrainMap(hexes: readonly H3Index[], terrain: TerrainKind): Map<H3Index, TerrainKind> {
  return new Map(hexes.map((h) => [h, terrain]));
}

describe('partitionIntoAreas', () => {
  it('keeps a connected run already inside the size band as one area', () => {
    const hexes = cellsWithin(ORIGIN, 2); // 19 hexes, all connected by construction
    expect(hexes.length).toBe(19);

    const areas = partitionIntoAreas(terrainMap(hexes, 'forest'), noFlags);
    expect(areas).toHaveLength(1);
    expect(areas[0]!.terrain).toBe('forest');
    expect(areas[0]!.hexes).toHaveLength(19);
  });

  it('splits a run bigger than ZONE.maxHexes into chunks that together cover it exactly once', () => {
    const hexes = cellsWithin(ORIGIN, 4); // 61 hexes > 55
    expect(hexes.length).toBeGreaterThan(ZONE.maxHexes);

    const areas = partitionIntoAreas(terrainMap(hexes, 'plain'), noFlags);
    expect(areas.length).toBeGreaterThan(1);
    for (const a of areas) expect(a.hexes.length).toBeLessThanOrEqual(ZONE.maxHexes);

    const covered = areas.flatMap((a) => a.hexes);
    expect(covered).toHaveLength(hexes.length);
    expect(new Set(covered).size).toBe(hexes.length); // no hex counted twice
  });

  it('folds a run smaller than ZONE.minHexes into its largest touching neighbour', () => {
    const big = cellsWithin(ORIGIN, 2); // 19 plain hexes
    const bigSet = new Set(big);
    // A small forest scrap touching the plain disk's own edge: `seed` is a neighbour of
    // some hex in `big`, and two of its own neighbours join it into a connected 3-hex run.
    const seed = big.flatMap((h) => neighboursOf(h)).find((h) => !bigSet.has(h))!;
    const seedNeighbours = neighboursOf(seed).filter((h) => !bigSet.has(h) && h !== seed);
    const small = [seed, seedNeighbours[0]!, seedNeighbours[1]!];

    const terrain = new Map<H3Index, TerrainKind>([
      ...big.map((h): [H3Index, TerrainKind] => [h, 'plain']),
      ...small.map((h): [H3Index, TerrainKind] => [h, 'forest']),
    ]);

    const areas = partitionIntoAreas(terrain, noFlags);
    expect(areas).toHaveLength(1);
    expect(areas[0]!.terrain).toBe('plain');
    expect(areas[0]!.hexes).toHaveLength(big.length + small.length);
  });

  it('keeps an isolated small cluster as its own area rather than dropping it', () => {
    // Nothing else in the map at all, so it has no neighbour to merge into.
    const small = cellsWithin(ORIGIN, 1).slice(0, 3);
    const areas = partitionIntoAreas(terrainMap(small, 'hill'), noFlags);
    expect(areas).toHaveLength(1);
    expect(areas[0]!.hexes).toHaveLength(3);
  });

  it('unions every member hex\'s flags onto the area', () => {
    const hexes = cellsWithin(ORIGIN, 1); // 7 — exactly ZONE.minHexes, stays one area
    const flagsOf = (h3: H3Index): readonly string[] => (h3 === hexes[0] ? ['shoreline'] : h3 === hexes[1] ? ['oldGrowth'] : []);

    const areas = partitionIntoAreas(terrainMap(hexes, 'forest'), flagsOf);
    expect(areas).toHaveLength(1);
    expect([...areas[0]!.flags].sort()).toEqual(['oldGrowth', 'shoreline']);
  });

  it('gives every area a stable, readable id', () => {
    const a = cellsWithin(ORIGIN, 1);
    const areas = partitionIntoAreas(terrainMap(a, 'marsh'), noFlags);
    expect(areas[0]!.id).toBe('marsh-1');
  });
});
