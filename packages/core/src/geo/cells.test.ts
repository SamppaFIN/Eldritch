import { cellToLatLng, getResolution } from 'h3-js';
import { describe, expect, it } from 'vitest';
import { H3_RES_OWNERSHIP, H3_RES_REGION } from '../rules/constants.js';
import { fixture } from '../sim/fixtures/index.js';
import { cellAreaM2, cellAt, neighboursOf, regionOf, ringToCells, totalAreaM2 } from './cells.js';
import { detectLoops } from './loopDetection.js';
import { haversine } from './haversine.js';
import { destination } from './project.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

function square(sw: { lat: number; lng: number }, side: number) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

describe('ringToCells', () => {
  it('fills a block with cells at ownership resolution', () => {
    const cells = ringToCells(square(ORIGIN, 200));
    expect(cells.length).toBeGreaterThan(10);
    for (const cell of cells) expect(getResolution(cell)).toBe(H3_RES_OWNERSHIP);
  });

  it('returns each cell once', () => {
    const cells = ringToCells(square(ORIGIN, 200));
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('is deterministic', () => {
    const ring = square(ORIGIN, 200);
    expect(ringToCells(ring)).toEqual(ringToCells(ring));
  });

  it('puts the cells where the ring is, not somewhere in the sea', () => {
    // lat/lng order is the classic way to get this wrong, and h3 will not complain:
    // it returns perfectly valid cells off the coast of Somalia.
    for (const cell of ringToCells(square(ORIGIN, 200))) {
      const [lat, lng] = cellToLatLng(cell);
      expect(haversine(ORIGIN, { lat, lng })).toBeLessThan(500);
    }
  });

  it('covers roughly the area walked', () => {
    // 200 m square is 40 000 m². Rasterising to ~1600 m² cells is coarse, so the
    // tolerance is wide — but it must not be out by a factor.
    const measured = totalAreaM2(ringToCells(square(ORIGIN, 200)));
    expect(measured).toBeGreaterThan(25_000);
    expect(measured).toBeLessThan(60_000);
  });

  it('gives a degenerate ring nothing', () => {
    expect(ringToCells([])).toEqual([]);
    expect(ringToCells([ORIGIN])).toEqual([]);
    expect(ringToCells([ORIGIN, destination(ORIGIN, 0, 50)])).toEqual([]);
  });

  it('grants at least one cell for the smallest claimable loop', () => {
    // MIN_LOOP_AREA_M2 is 5000 m², about 70 m square. If that produced no cells the
    // threshold and the resolution would be disagreeing about what counts as land.
    expect(ringToCells(square(ORIGIN, 71)).length).toBeGreaterThan(0);
  });
});

describe('ringToCells on a real walk', () => {
  it('turns the square fixture into territory', () => {
    const loops = detectLoops(fixture('square').points);
    const cells = ringToCells(loops[0]?.points ?? []);
    expect(cells.length).toBeGreaterThan(3);
  });

  it('turns both halves of the figure-eight into separate territory', () => {
    const loops = detectLoops(fixture('figure-eight').points);
    expect(loops).toHaveLength(2);

    const first = new Set(ringToCells(loops[0]?.points ?? []));
    const second = new Set(ringToCells(loops[1]?.points ?? []));

    expect(first.size).toBeGreaterThan(0);
    expect(second.size).toBeGreaterThan(0);
    // The two blocks share a corner, so a little overlap is honest — but they are
    // not the same territory claimed twice.
    const shared = [...first].filter((c) => second.has(c));
    expect(shared.length).toBeLessThan(Math.min(first.size, second.size) / 2);
  });
});

describe('cellAt', () => {
  it('places a position in a cell at ownership resolution', () => {
    expect(getResolution(cellAt(ORIGIN))).toBe(H3_RES_OWNERSHIP);
  });

  it('puts a position inside the ring that contains it', () => {
    expect(ringToCells(square(ORIGIN, 300))).toContain(
      cellAt(destination(destination(ORIGIN, 0, 150), 90, 150)),
    );
  });

  it('gives nearby positions the same cell and distant ones a different one', () => {
    expect(cellAt(ORIGIN)).toBe(cellAt(destination(ORIGIN, 45, 3)));
    expect(cellAt(ORIGIN)).not.toBe(cellAt(destination(ORIGIN, 45, 500)));
  });
});

describe('regionOf', () => {
  it('returns a res-6 parent', () => {
    expect(getResolution(regionOf(cellAt(ORIGIN)))).toBe(H3_RES_REGION);
  });

  it('puts neighbouring cells in the same region', () => {
    const cell = cellAt(ORIGIN);
    for (const neighbour of neighboursOf(cell)) {
      expect(regionOf(neighbour)).toBe(regionOf(cell));
    }
  });
});

describe('neighboursOf', () => {
  it('returns six, and not the cell itself', () => {
    const cell = cellAt(ORIGIN);
    const neighbours = neighboursOf(cell);
    // Seven would mean a cell counts as its own neighbour, and every cell in the game
    // would quietly carry one extra neighbour bonus.
    expect(neighbours).toHaveLength(6);
    expect(neighbours).not.toContain(cell);
  });

  it('is symmetric', () => {
    const cell = cellAt(ORIGIN);
    for (const neighbour of neighboursOf(cell)) {
      expect(neighboursOf(neighbour)).toContain(cell);
    }
  });
});

describe('cellAreaM2', () => {
  it('reports the real area, not the global mean', () => {
    // 2150 m² is the nominal figure. At 61°N it is about 1622.
    const area = cellAreaM2(cellAt(ORIGIN));
    expect(area).toBeGreaterThan(1_400);
    expect(area).toBeLessThan(1_800);
  });

  it('sums a set', () => {
    const cells = ringToCells(square(ORIGIN, 200));
    expect(totalAreaM2(cells)).toBeCloseTo(
      cells.reduce((sum, c) => sum + cellAreaM2(c), 0),
      6,
    );
  });

  it('is zero for nothing', () => {
    expect(totalAreaM2([])).toBe(0);
  });
});
