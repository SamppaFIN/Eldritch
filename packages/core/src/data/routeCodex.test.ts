import { describe, expect, it } from 'vitest';
import { routeCodexOf, routePlacementOf } from './routeCodex.js';
import type { RouteMeasurable } from './routeCodex.js';

function realm(id: string, distanceM: number, hexes: number): RouteMeasurable {
  return {
    id,
    name: id,
    routeDistanceM: distanceM,
    cells: Array.from({ length: hexes }, (_, i) => ({ h3: `h3-${id}-${i}`, strength: 100 })),
  };
}

describe('routeCodexOf (BRDC-MODE-002)', () => {
  it('is empty for no realms', () => {
    const codex = routeCodexOf([], 1000);
    expect(codex.players).toBe(0);
    expect(codex.ranked).toEqual([]);
  });

  it('ranks by distance, furthest first', () => {
    const codex = routeCodexOf([realm('a', 500, 3), realm('b', 1500, 1), realm('c', 900, 2)], 1000);
    expect(codex.ranked.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('breaks a distance tie on hex count', () => {
    const codex = routeCodexOf([realm('a', 1000, 2), realm('b', 1000, 5)], 1000);
    expect(codex.ranked.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('treats a missing routeDistanceM as zero, not skipped', () => {
    const codex = routeCodexOf([{ id: 'a', name: 'a', cells: [] }, realm('b', 10, 0)], 1000);
    expect(codex.players).toBe(2);
    expect(codex.ranked.map((r) => r.id)).toEqual(['b', 'a']);
    expect(codex.ranked[1]?.distanceM).toBe(0);
  });
});

describe('routePlacementOf (BRDC-MODE-002)', () => {
  it('returns null for a realm not in the table', () => {
    const codex = routeCodexOf([realm('a', 100, 1)], 1000);
    expect(routePlacementOf(codex, 'ghost')).toBeNull();
  });

  it('places the leader first of the field', () => {
    const codex = routeCodexOf([realm('a', 500, 1), realm('b', 100, 1)], 1000);
    expect(routePlacementOf(codex, 'a')).toEqual({ rank: 1, of: 2 });
    expect(routePlacementOf(codex, 'b')).toEqual({ rank: 2, of: 2 });
  });

  it('shares a rank between ties', () => {
    const codex = routeCodexOf([realm('a', 100, 2), realm('b', 100, 2), realm('c', 50, 1)], 1000);
    expect(routePlacementOf(codex, 'a')).toEqual({ rank: 1, of: 3 });
    expect(routePlacementOf(codex, 'b')).toEqual({ rank: 1, of: 3 });
    expect(routePlacementOf(codex, 'c')).toEqual({ rank: 3, of: 3 });
  });
});
