/**
 * BRDC-BUILD-003 — area auras sum to a cap, and loyalty slows but never stops decay.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { AURA_CAP_PER_CELL, DEFENCE_AURA_CAP, LOYALTY_MAX, LOYALTY_PER_SOURCE } from './constants.js';
import { defenceAura, loyaltyFactor, loyaltySourceCells, resourceAura } from './aura.js';
import { BUILDINGS } from './build.js';
import type { BuildingId, Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-01T12:00:00Z');
const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });
const RING = neighboursOf(HOME);

function cell(h3: string, over: Partial<Cell> = {}): Cell {
  return { h3, ownerId: 'me', strength: 300, lastVisitedAt: T0, visitDays: [], ...over };
}
const withBuilding = (h3: string, id: BuildingId, over: Partial<Cell> = {}): Cell =>
  cell(h3, { building: { id, builtAt: T0 }, ...over });

describe('resourceAura', () => {
  it('projects a Library across its radius, over held cells', () => {
    // Library on HOME (radius 1 → HOME + its six neighbours), all held: seven cells × 1.
    const cells = [withBuilding(HOME, 'library'), ...RING.map((h) => cell(h))];
    expect(resourceAura(cells, T0)).toEqual({ wisdom: 7 });
  });

  it('credits nothing where the radius leaves the ground the player holds', () => {
    // Library on HOME, but only HOME is in the list — the six neighbours are not held.
    expect(resourceAura([withBuilding(HOME, 'library')], T0)).toEqual({ wisdom: 1 });
  });

  it('caps what one cell can take from overlapping auras', () => {
    // HOME held and bare; the grove sources are measured in isolation, so only HOME is
    // credited. Two sources → 2 (under the cap); six → the cap, not six.
    const target = [cell(HOME)];
    const groves = RING.map((h) => withBuilding(h, 'temple-grove'));
    expect(resourceAura(target, T0, groves.slice(0, 2))).toEqual({ mana: 2 });
    expect(resourceAura(target, T0, groves)).toEqual({ mana: AURA_CAP_PER_CELL });
  });

  it('a dormant source is dark', () => {
    const stale = withBuilding(HOME, 'library', { lastVisitedAt: T0 - 10 * 86_400_000 });
    expect(resourceAura([stale, ...RING.map((h) => cell(h))], T0)).toEqual({});
  });

  it('is empty with no aura buildings', () => {
    expect(resourceAura([cell(HOME), withBuilding(RING[0] as string, 'market')], T0)).toEqual({});
  });
});

describe('defenceAura', () => {
  const map = (cells: Cell[]) => new Map(cells.map((c) => [c.h3, c]));
  const FORT = BUILDINGS.fortress.aura?.amount ?? 0;

  it('sums the defender Fortresses within radius of the cell', () => {
    const known = map([
      cell(HOME, { ownerId: 'rival' }),
      withBuilding(RING[0] as string, 'fortress', { ownerId: 'rival' }),
      withBuilding(RING[1] as string, 'fortress', { ownerId: 'rival' }),
    ]);
    expect(defenceAura(known, HOME, 'rival')).toBe(2 * FORT);
  });

  it('ignores a Fortress held by someone else, and non-Fortress buildings', () => {
    const known = map([
      withBuilding(RING[0] as string, 'fortress', { ownerId: 'me' }),
      withBuilding(RING[1] as string, 'monument', { ownerId: 'rival' }),
    ]);
    expect(defenceAura(known, HOME, 'rival')).toBe(0);
  });

  it('is capped, so a cell never becomes un-takeable', () => {
    const forts = RING.map((h) => withBuilding(h, 'fortress', { ownerId: 'rival' }));
    expect(defenceAura(map(forts), HOME, 'rival')).toBe(DEFENCE_AURA_CAP);
  });
});

describe('loyaltySourceCells', () => {
  it('is the player Monuments plus every revealed place', () => {
    const cells = [withBuilding(HOME, 'monument'), withBuilding(RING[0] as string, 'market')];
    const sources = loyaltySourceCells(cells, [RING[1] as string]);
    expect(sources.has(HOME)).toBe(true);
    expect(sources.has(RING[1] as string)).toBe(true);
    expect(sources.has(RING[0] as string)).toBe(false);
  });
});

describe('loyaltyFactor', () => {
  it('is 1 with no source adjacent', () => {
    expect(loyaltyFactor(HOME, new Set())).toBe(1);
    expect(loyaltyFactor(HOME, new Set([cellAt({ lat: 60, lng: 22 })]))).toBe(1);
  });

  it('drops one step per adjacent source', () => {
    expect(loyaltyFactor(HOME, new Set([RING[0] as string]))).toBeCloseTo(1 - LOYALTY_PER_SOURCE, 5);
    expect(loyaltyFactor(HOME, new Set(RING.slice(0, 2)))).toBeCloseTo(1 - 2 * LOYALTY_PER_SOURCE, 5);
  });

  it('never falls past the floor — it slows the Void, not stops it', () => {
    expect(loyaltyFactor(HOME, new Set(RING))).toBe(1 - LOYALTY_MAX);
    expect(loyaltyFactor(HOME, new Set(RING))).toBeGreaterThan(0);
  });
});
