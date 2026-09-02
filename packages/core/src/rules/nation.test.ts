import { describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { POP_PER_BUILDING, POP_PER_CELL } from './constants.js';
import { population, provinceCount } from './nation.js';
import type { Cell } from '../types/domain.js';

const cell = (lat: number, lng: number): Cell => ({
  h3: cellAt({ lat, lng }),
  ownerId: 'me',
  strength: 100,
  lastVisitedAt: 0,
  visitDays: [],
});

describe('provinceCount', () => {
  it('counts distinct res-6 regions, not cells', () => {
    // Three cells a few metres apart share one region.
    const near = [cell(61.473, 23.726), cell(61.4731, 23.7261), cell(61.4732, 23.7262)];
    expect(provinceCount(near)).toBe(1);
  });

  it('rises when the ground reaches a second region', () => {
    // ~0.2° north is well past one ~6 km res-6 cell.
    const spread = [cell(61.473, 23.726), cell(61.673, 23.726)];
    expect(provinceCount(spread)).toBe(2);
  });

  it('is zero with no ground', () => {
    expect(provinceCount([])).toBe(0);
  });
});

describe('population', () => {
  it('scales with cells and buildings', () => {
    expect(population(0, 0)).toBe(0);
    expect(population(10, 0)).toBe(10 * POP_PER_CELL);
    expect(population(10, 3)).toBe(10 * POP_PER_CELL + 3 * POP_PER_BUILDING);
  });

  it('never goes negative on odd input', () => {
    expect(population(-5, -2)).toBe(0);
  });
});
