/**
 * BRDC-SCALE-001 — the sweep's Fortress and loyalty answers, built once from the sources,
 * say exactly what the per-hex `fortified` and `loyaltyFactor` say.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { prng } from '../sim/walk.js';
import { fortified, fortressCover, loyaltyByCell, loyaltyFactor } from './aura.js';
import type { BuildingId, Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-13T12:00:00Z');
const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });

/** A mixed realm: me, a rival, unowned; a few Fortresses and Monuments for each. */
function realm(seed: number): Cell[] {
  const roll = prng(seed);
  return cellsWithin(HOME, 6).map((h3) => {
    const r = roll();
    const ownerId = r < 0.55 ? 'me' : r < 0.85 ? 'rival' : null;
    const b = roll();
    const work: BuildingId | null = ownerId && b < 0.03 ? 'fortress' : ownerId && b < 0.08 ? 'monument' : null;
    return { h3, ownerId, strength: 100, lastVisitedAt: T0, visitDays: [], ...(work ? { buildings: [{ id: work, builtAt: T0 }] } : {}) } as Cell;
  });
}

describe('fortressCover', () => {
  it('protects exactly the hexes fortified() protects, owner by owner', () => {
    for (const seed of [1, 2, 3]) {
      const known = new Map(realm(seed).map((c) => [c.h3, c]));
      const cover = fortressCover(known);
      for (const c of known.values()) {
        const viaCover = c.ownerId !== null && (cover.get(c.h3)?.has(c.ownerId) ?? false);
        expect(viaCover, c.h3).toBe(fortified(known, c.h3));
      }
    }
  });

  it('protects nothing without a Fortress', () => {
    expect(fortressCover(new Map()).size).toBe(0);
  });
});

describe('loyaltyByCell', () => {
  it('gives every hex the factor loyaltyFactor() gives it', () => {
    for (const seed of [4, 5]) {
      const cells = realm(seed);
      const sources = new Set(cells.filter((c) => c.buildings?.some((b) => b.id === 'monument')).map((c) => c.h3));
      const byCell = loyaltyByCell(sources);
      for (const c of cells) expect(byCell.get(c.h3) ?? 1, c.h3).toBeCloseTo(loyaltyFactor(c.h3, sources), 10);
    }
  });
});
