import { describe, expect, it } from 'vitest';
import { groupYield, signed } from './CellYield.js';

describe('the card’s yield lines (BRDC-CARD-006)', () => {
  it('signs and rounds to one decimal, whole numbers without one', () => {
    expect([signed(2), signed(1.5), signed(-0.84), signed(0.04)]).toEqual(['+2', '+1.5', '−0.8', '+0']);
  });

  it('groups by resource, totals each, drops what nets to nothing, largest first', () => {
    const g = groupYield({
      totals: {},
      contributions: [
        { resource: 'food', amount: 6, source: 'citizen', label: 'Farmstead · 2 workers' },
        { resource: 'food', amount: -1.2, source: 'other', label: 'Sanity' },
        { resource: 'wood', amount: 2, source: 'terrain', label: 'Terrain: Forest' },
        { resource: 'gold', amount: 0, source: 'other', label: 'Nothing' },
      ],
    });
    expect(g.map((x) => [x.resource, Math.round(x.total * 10) / 10])).toEqual([['food', 4.8], ['wood', 2]]);
    expect(g[0]?.lines.map((l) => l.label)).toEqual(['Farmstead · 2 workers', 'Sanity']);
  });
});
