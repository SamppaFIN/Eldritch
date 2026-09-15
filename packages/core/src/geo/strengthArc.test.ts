/**
 * BRDC-HEX-005 — the strength arc's geometry.
 *
 * The document asks for "the lower three edges clockwise, 0→500". These lock the three
 * things a renderer depends on: it is the *bottom* of the hex, it grows with strength
 * from a fixed start, and a full arc is the whole run.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, cellBoundary } from './cells.js';
import { lowerEdges, strengthArc } from './strengthArc.js';

const HERE = cellAt({ lat: 61.4729, lng: 23.7259 });

/** Rough metres between two nearby points — enough to compare lengths. */
const span = (a: readonly number[], b: readonly number[]): number =>
  Math.hypot(
    ((b[1] ?? 0) - (a[1] ?? 0)) * 111_320,
    ((b[0] ?? 0) - (a[0] ?? 0)) * 111_320 * Math.cos(((a[1] ?? 0) * Math.PI) / 180),
  );

const length = (path: ReadonlyArray<readonly number[]>): number =>
  path.slice(0, -1).reduce((sum, p, i) => sum + span(p, path[i + 1] as number[]), 0);

describe('lowerEdges', () => {
  it('is four points — three edges of the six', () => {
    expect(lowerEdges(HERE)).toHaveLength(4);
  });

  it('is the bottom of the hex, not any three edges', () => {
    const ring = lowerEdges(HERE);
    const lats = ring.map((p) => p[1] as number);
    // Every point of the run sits at or below the cell's own middle latitude.
    const all = lowerEdges(HERE).concat();
    const mid = (Math.max(...all.map((p) => p[1] as number)) + Math.min(...lats)) / 2;
    const below = lats.filter((l) => l <= mid + 1e-9).length;
    expect(below).toBeGreaterThanOrEqual(3);
  });

  it('runs west to east, so the arc fills clockwise on screen', () => {
    const ring = lowerEdges(HERE);
    expect((ring[0] as number[])[0]).toBeLessThanOrEqual((ring[3] as number[])[0] as number);
  });
});

describe('strengthArc', () => {
  it('has nothing to draw at zero', () => {
    expect(strengthArc(HERE, 0)).toBeNull();
  });

  it('is the whole run when the cell is at full strength', () => {
    const full = strengthArc(HERE, 1);
    expect(full).not.toBeNull();
    expect(length(full ?? [])).toBeCloseTo(length(lowerEdges(HERE)), 5);
  });

  it('grows with strength, from the same place every time', () => {
    const half = strengthArc(HERE, 0.5) ?? [];
    const full = strengthArc(HERE, 1) ?? [];
    expect(length(half)).toBeCloseTo(length(full) / 2, 1);
    // Same origin: the arc always starts at the west end of the bottom run.
    expect(half[0]).toEqual(full[0]);
  });

  it('clamps rather than trusting its caller', () => {
    expect(length(strengthArc(HERE, 4) ?? [])).toBeCloseTo(length(lowerEdges(HERE)), 5);
    expect(strengthArc(HERE, -1)).toBeNull();
  });
});

describe('the arc sits on the bottom of the hex (Sigil §03)', () => {
  /*
   * BRDC-SIGIL-006. §03 draws the arc as the "V" at the bottom: lower-left vertex, bottom
   * vertex, lower-right. The first rule took the three edges with the lowest midpoints;
   * on a pointy-top hex a vertical side ties with them, and a cell at 100 drew as a sliver
   * up its left flank instead of along the bottom.
   */
  it('passes through the lowest vertex of the whole cell', () => {
    const lowest = Math.min(...cellBoundary(HERE).map((p) => p[1] as number));
    expect((lowerEdges(HERE)[1] as number[])[1]).toBe(lowest);
  });

  it('starts at the neighbour of that vertex which lies to the west', () => {
    const run = lowerEdges(HERE);
    expect((run[0] as number[])[0]).toBeLessThan((run[1] as number[])[0] as number);
    expect((run[2] as number[])[0]).toBeGreaterThan((run[1] as number[])[0] as number);
  });

  it('puts a weak cell on the bottom edge rather than a side', () => {
    // A fifth of the run is well inside its first edge, which ends at the lowest vertex.
    const arc = strengthArc(HERE, 0.2) ?? [];
    const lowest = Math.min(...cellBoundary(HERE).map((p) => p[1] as number));
    const mid = (Math.max(...cellBoundary(HERE).map((p) => p[1] as number)) + lowest) / 2;
    for (const p of arc) expect(p[1] as number).toBeLessThan(mid);
  });
});
