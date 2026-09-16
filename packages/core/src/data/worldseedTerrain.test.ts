import { describe, expect, it } from 'vitest';
import { applyCoastalSplit, classifyGrid, classifyHex } from './worldseedTerrain.js';
import type { ZoneOverrideRecord } from './worldseedTerrain.js';
import { cellAt, cellCentre, neighboursOf } from '../geo/cells.js';
import harmalaSeed from './seed/harmala.registered.json' with { type: 'json' };

const ZONES = harmalaSeed.zoneOverrides as unknown as ZoneOverrideRecord[];

describe('classifyHex', () => {
  it('classifies a point inside a bounds zone with its terrain, high confidence', () => {
    const marsh = ZONES.find((z) => z.name.endsWith('suo'))!;
    const [south, west, north, east] = marsh.bounds!;
    const inside = { lat: (south + north) / 2, lng: (west + east) / 2 };
    const result = classifyHex(inside, ZONES);
    expect(result.terrain).toBe('marsh');
    expect(result.confidence).toBe(0.9);
    expect(result.flags).toContain('shoreline');
  });

  it('falls back to plain, low confidence, outside every zone', () => {
    // South of every zone's bounds and south of the shoreline's own latitude at this
    // longitude — clear of the `bboxNorthOf` rule too, not just the boxes.
    const result = classifyHex({ lat: 61.45, lng: 23.73 }, ZONES);
    expect(result.terrain).toBe('plain');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("renames Worldseed's trade to the game's market", () => {
    const trade = ZONES.find((z) => z.name.includes('liikealue'))!;
    const [south, west, north, east] = trade.bounds!;
    const inside = { lat: (south + north) / 2, lng: (west + east) / 2 };
    expect(classifyHex(inside, ZONES).terrain).toBe('market');
  });

  it('resolves an overlap to the higher-priority zone (marsh over forest)', () => {
    // Vähäjärvenpuisto (forest, priority 1) and Vähäjärven suo (marsh, priority 2)
    // overlap on purpose (the seed's own note) — a point inside both must read marsh.
    // Priority, not the name, is what picks the right zone: two forest zones in this seed
    // end in "puisto".
    const forest = ZONES.find((z) => z.terrain === 'forest' && z.priority === 1)!;
    const marsh = ZONES.find((z) => z.terrain === 'marsh' && z.priority === 2)!;
    const point = { lat: 61.4649, lng: 23.733 };

    const inBounds = (b: BoxLike) => point.lat >= b[0] && point.lat <= b[2] && point.lng >= b[1] && point.lng <= b[3];
    expect(inBounds(forest.bounds!)).toBe(true);
    expect(inBounds(marsh.bounds!)).toBe(true);

    expect(classifyHex(point, ZONES).terrain).toBe('marsh');
  });

  it('reads the shoreline rule: north of the line is water, south is not', () => {
    const shore = ZONES.find((z) => z.kind === 'bboxNorthOf')!;
    const [lat0, lng0] = shore.shoreline![0]!;
    const north = classifyHex({ lat: lat0 + 0.002, lng: lng0 }, ZONES);
    const south = classifyHex({ lat: lat0 - 0.01, lng: lng0 }, ZONES);
    expect(north.terrain).toBe('lake');
    expect(south.terrain).not.toBe('lake');
  });
});

type BoxLike = readonly [number, number, number, number];
type Classified = { terrain: 'lake' | 'plain'; confidence: number; flags: string[] };

describe('applyCoastalSplit', () => {
  it('keeps an interior water hex a lake when every neighbour is also water', () => {
    const centre = cellAt({ lat: 61.478, lng: 23.727 });
    const ring = neighboursOf(centre);
    const grid = [centre, ...ring];
    const classified = new Map<string, Classified>(
      grid.map((h3) => [h3, { terrain: 'lake', confidence: 0.9, flags: [] }]),
    );

    const result = applyCoastalSplit(grid, classified);
    expect(result.get(centre)!.terrain).toBe('lake');
  });

  it('turns a water hex touching a classified non-water neighbour into coast', () => {
    const centre = cellAt({ lat: 61.478, lng: 23.727 });
    const ring = neighboursOf(centre);
    const [edge, ...restOfRing] = ring;
    const grid = [centre, ...ring];
    const classified = new Map<string, Classified>([
      [centre, { terrain: 'lake', confidence: 0.9, flags: [] }],
      [edge!, { terrain: 'plain', confidence: 0.4, flags: [] }],
      ...restOfRing.map((h3): [string, Classified] => [h3, { terrain: 'lake', confidence: 0.9, flags: [] }]),
    ]);

    const result = applyCoastalSplit(grid, classified);
    expect(result.get(centre)!.terrain).toBe('coast');
  });

  it('does not count a neighbour outside the classified set as land', () => {
    // Only the centre is classified — its real neighbours are simply unknown, not shore.
    const centre = cellAt({ lat: 61.478, lng: 23.727 });
    const classified = new Map<string, Classified>([[centre, { terrain: 'lake', confidence: 0.9, flags: [] }]]);
    const result = applyCoastalSplit([centre], classified);
    expect(result.get(centre)!.terrain).toBe('lake');
  });
});

describe('classifyGrid', () => {
  it('classifies a small real patch and applies the coastal split together', () => {
    const centre = cellAt({ lat: 61.478, lng: 23.727 });
    const grid = [centre, ...neighboursOf(centre)];
    const result = classifyGrid(grid, cellCentre, ZONES);
    expect(result.size).toBe(grid.length);
    for (const h3 of grid) expect(result.get(h3)).toBeDefined();
  });
});
