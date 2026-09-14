/**
 * BRDC-SIGIL-004 — the generated realm marks, and the geometry they are built from.
 */
import { describe, expect, it } from 'vitest';
import { FRUIT_OF_LIFE, chords, pairs, poly, ring, spiral } from './realmMarkGeometry.js';
import { REALM_MARKS, REALM_MARK_IDS, isRealmMark } from './realmMarks.js';

describe('the four constructions', () => {
  it('ring places every circle the same distance from the centre', () => {
    const circles = ring(6, 16, 0, 8);
    expect(circles).toHaveLength(6);
    for (const c of circles) {
      expect(Math.hypot(c.x - 50, c.y - 50)).toBeCloseTo(16, 1);
      expect(c.r).toBe(8);
    }
  });

  it('poly closes its own path', () => {
    expect(poly(3, 34, -90)).toMatch(/Z$/);
    expect(poly(3, 34, -90).match(/M|L/g)).toHaveLength(3);
  });

  it('chords joins every step-th point, and returns to the start after n/gcd steps', () => {
    // A pentagram: five points, every second one — the classic five-pointed star.
    const star = chords(5, 2, 34, -90);
    expect(star.match(/M/g)).toHaveLength(5);
  });

  it('pairs joins every two nodes exactly once — the whole point of Metatron\'s Cube', () => {
    const nodes = ring(4, 10, 0, 1);
    const d = pairs(nodes);
    // 4 choose 2 = 6 lines.
    expect(d.match(/M/g)).toHaveLength(6);
  });

  it('spiral grows outward and ends further from the centre than it started', () => {
    const d = spiral(2, 2, 3);
    const points = [...d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(
      (m): [number, number] => [Number(m[1]), Number(m[2])],
    );
    const distFromCentre = (p: [number, number]) => Math.hypot(p[0] - 50, p[1] - 50);
    expect(distFromCentre(points[points.length - 1] as [number, number])).toBeGreaterThan(
      distFromCentre(points[0] as [number, number]),
    );
  });

  it('the Fruit of Life is thirteen circles: one centre, two rings of six', () => {
    expect(FRUIT_OF_LIFE).toHaveLength(13);
    expect(FRUIT_OF_LIFE[0]).toEqual({ x: 50, y: 50, r: 8 });
  });
});

describe('the realm marks', () => {
  it('has eighteen of the document\'s twenty — Vesica and the broken Drowned Knot dropped', () => {
    expect(REALM_MARK_IDS).toHaveLength(18);
    expect(REALM_MARK_IDS).not.toContain('vesica');
    expect(REALM_MARK_IDS).not.toContain('drowned-knot');
  });

  it('gives every mark a name, lore, an ink, and something to actually draw', () => {
    for (const id of REALM_MARK_IDS) {
      const mark = REALM_MARKS[id];
      expect(mark.name.length).toBeGreaterThan(0);
      expect(mark.lore.length).toBeGreaterThan(0);
      // Circles alone, a path alone, or both — never neither, or the mark is a blank tile.
      expect(mark.circles.length > 0 || mark.d.length > 0).toBe(true);
    }
  });

  it('gives no two marks the same picture', () => {
    const pictures = REALM_MARK_IDS.map((id) => JSON.stringify(REALM_MARKS[id].circles) + REALM_MARKS[id].d);
    expect(new Set(pictures).size).toBe(REALM_MARK_IDS.length);
  });

  it('isRealmMark tells a generated mark from a hand-drawn original', () => {
    expect(isRealmMark('metatrons-cube')).toBe(true);
    expect(isRealmMark('vesica')).toBe(false);
    expect(isRealmMark('heptagram')).toBe(false);
  });
});
