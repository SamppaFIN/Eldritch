/** BRDC-EUREKA-001 — every Lore has a condition read from the realm; met, it costs half. */
import { describe, expect, it } from 'vitest';
import { eurekaCost, eurekaFor } from './eureka.js';
import { LORE_IDS } from './lore.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import type { BuildingId, Cell, TerrainKind } from '../types/domain.js';

const T = Date.parse('2026-10-06T12:00:00Z');
const hexes = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 3);
const cell = (i: number, kind: TerrainKind = 'plain', works: BuildingId[] = []): Cell => ({
  h3: hexes[i] as string, ownerId: 'me', strength: 100, lastVisitedAt: T, visitDays: [],
  terrain: { kind, source: 'tiles' }, buildings: works.map((id) => ({ id, builtAt: T })),
});
const state = (owned: Cell[], temples = 0, revealed = 0) => ({ owned, temples, revealed });

describe('eurekaFor', () => {
  it('every Lore has one, with something to do', () => {
    for (const id of LORE_IDS) {
      const e = eurekaFor(id, state([]));
      expect(e.text.length).toBeGreaterThan(5);
      expect(e.need).toBeGreaterThan(0);
      expect(e.met).toBe(false);
    }
  });

  it('reads held ground: Woodcraft wants 3 forest hexes', () => {
    const two = [cell(0, 'forest'), cell(1, 'forest'), cell(2, 'plain')];
    expect(eurekaFor('woodcraft', state(two))).toEqual({ text: 'Hold 3 forest hexes', have: 2, need: 3, met: false });
    expect(eurekaFor('woodcraft', state([...two, cell(3, 'forest')])).met).toBe(true);
  });

  it('reads Works, temples and reveals', () => {
    expect(eurekaFor('granaries', state([cell(0, 'plain', ['farm'])])).met).toBe(true);
    expect(eurekaFor('kindling', state([], 1)).met).toBe(true);
    expect(eurekaFor('deep-survey', state([], 0, 9)).met).toBe(false);
    expect(eurekaFor('deep-survey', state([], 0, 10)).met).toBe(true);
  });

  it('never says more than it needs', () => {
    expect(eurekaFor('kindling', state([], 5)).have).toBe(1);
  });
});

describe('eurekaCost', () => {
  it('halves the price when met, floored', () => {
    expect(eurekaCost(45, true)).toBe(22);
    expect(eurekaCost(45, false)).toBe(45);
  });
});
