import { describe, expect, it } from 'vitest';
import { cellAt, cellBoundary, neighboursOf } from './cells.js';
import { cellCentreLngLat, cellNeighbours, cellRing, geometryWork } from './cellGeometry.js';

const H = cellAt({ lat: 61.4729, lng: 23.7259 });

describe('cellGeometry (BRDC-PERF-003)', () => {
  it('a ring is closed and matches the open boundary', () => {
    const ring = cellRing(H);
    expect(ring.length).toBe(cellBoundary(H).length + 1);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring.slice(0, -1)).toEqual(cellBoundary(H));
  });

  it('computes each shape once, then hands back the same one', () => {
    const first = cellRing(H);
    const before = geometryWork();
    expect(cellRing(H)).toBe(first);
    cellCentreLngLat(H);
    cellCentreLngLat(H);
    expect(geometryWork() - before).toBeLessThanOrEqual(1);
  });

  it('neighbours are the six around it', () => {
    expect([...cellNeighbours(H)].sort()).toEqual([...neighboursOf(H)].sort());
    expect(cellNeighbours(H)).toHaveLength(6);
  });
});
