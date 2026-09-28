import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from './cells.js';
import { realmOutline } from './realmOutline.js';

const H = cellAt({ lat: 61.4729, lng: 23.7259 });

describe('realmOutline (BRDC-PERF-004)', () => {
  it('a solid realm is one polygon with one outer ring, closed', () => {
    const out = realmOutline(cellsWithin(H, 3));
    expect(out).toHaveLength(1);
    const ring = out[0]![0]!;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('two separate patches are two polygons', () => {
    const far = cellsWithin(H, 10).find((h) => !cellsWithin(H, 8).includes(h))!;
    expect(realmOutline([H, far])).toHaveLength(2);
  });

  it('the same set again is the same answer, not a new merge', () => {
    const cells = cellsWithin(H, 2);
    const a = realmOutline(cells);
    expect(realmOutline([...cells].reverse())).toBe(a);
  });

  it('nothing held is nothing drawn', () => {
    expect(realmOutline([])).toEqual([]);
  });
});
