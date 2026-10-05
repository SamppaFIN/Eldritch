import { describe, expect, it } from 'vitest';
import { cellAt } from '@es3/core';
import { yieldAmount, yieldFeatures } from './yieldLayer.js';

const A = cellAt({ lat: 61.4729, lng: 23.7258 });
const y = (totals: Record<string, number>) => ({ totals, contributions: [] });

describe('the yield overlay (BRDC-MAP-008)', () => {
  it('one resource sits in the centre, two either side, three across; nothing below half a unit', () => {
    const one = yieldFeatures({ [A]: y({ food: 2, gold: 0.2 }) }).features[0]?.properties;
    expect(one).toEqual({ rc: 'food', ac: '2' });
    const two = yieldFeatures({ [A]: y({ food: 2, mana: 6 }) }).features[0]?.properties;
    expect(two).toEqual({ rl: 'mana', al: '6', rr: 'food', ar: '2' });
    const three = yieldFeatures({ [A]: y({ food: 2, mana: 6, wisdom: 1.5 }) }).features[0]?.properties;
    expect(three).toMatchObject({ rl: 'mana', rc: 'food', rr: 'wisdom', ar: '1.5' });
    expect(yieldFeatures({ [A]: y({}) }).features).toHaveLength(0);
  });

  it('shows whole numbers whole, small fractions to one decimal', () => {
    expect([yieldAmount(2), yieldAmount(1.54), yieldAmount(12.4)]).toEqual(['2', '1.5', '12']);
  });
});
