import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin, geometryWork } from '@es3/core';
import type { Cell } from '@es3/core';
import { cellsToGeoJson, marksFromPolygons } from './cellMarks.js';
import { diffFeatures, keyed } from './territorySync.js';

const NOW = Date.UTC(2026, 8, 28, 12);
const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });

const realm = (rings: number): Cell[] =>
  cellsWithin(HOME, rings).map(
    (h3) => ({ h3, ownerId: 'me', strength: 300, claimedAt: NOW, lastVisitedAt: NOW, lastReinforcedAt: NOW }) as unknown as Cell,
  );

const sent = (cells: Cell[]) => {
  const features = keyed(cellsToGeoJson(cells, 'me', NOW));
  return diffFeatures(new Map(), features).next;
};

describe('territory sync (BRDC-PERF-003)', () => {
  it('a second build of the same ground computes no shape again', () => {
    const cells = realm(6);
    marksFromPolygons(cellsToGeoJson(cells, 'me', NOW));
    const before = geometryWork();
    marksFromPolygons(cellsToGeoJson(cells, 'me', NOW));
    expect(geometryWork()).toBe(before);
  });

  it('the same ground again sends nothing', () => {
    const cells = realm(6);
    const d = diffFeatures(sent(cells), keyed(cellsToGeoJson(cells, 'me', NOW)));
    expect([d.add.length, d.remove.length, d.update.length]).toEqual([0, 0, 0]);
  });

  it('one reinforced hex is one update, not the whole realm', () => {
    const cells = realm(18);
    const prev = sent(cells);
    const changed = cells.map((c, i) => (i === 40 ? { ...c, strength: 450 } : c));
    const d = diffFeatures(prev, keyed(cellsToGeoJson(changed, 'me', NOW)));
    expect(d.add.length + d.remove.length + d.update.length).toBeLessThanOrEqual(7);
    expect(d.update.map((f) => f.properties['h3'])).toContain(cells[40]!.h3);
  });

  it('one new hex on the edge is an add plus its neighbours, at most seven changes', () => {
    const cells = realm(6);
    const prev = sent(cells);
    const outside = cellsWithin(HOME, 7).find((h) => !cells.some((c) => c.h3 === h))!;
    const grown = [...cells, { ...cells[0]!, h3: outside }];
    const d = diffFeatures(prev, keyed(cellsToGeoJson(grown, 'me', NOW)));
    expect(d.add).toHaveLength(1);
    expect(d.add.length + d.remove.length + d.update.length).toBeLessThanOrEqual(7);
  });

  it('a hex gone is a remove', () => {
    const cells = realm(3);
    const prev = sent(cells);
    const d = diffFeatures(prev, keyed(cellsToGeoJson(cells.slice(1), 'me', NOW)));
    expect(d.remove).toEqual([cells[0]!.h3]);
  });

  it('every feature carries its hex as the promoted id', () => {
    for (const f of keyed(cellsToGeoJson(realm(1), 'me', NOW))) expect(f.properties['h3']).toBe(f.id);
  });
});
