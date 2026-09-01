import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from '@es3/core';
import { positiveDelta } from './usePouchPolling.js';

const pool = (over: Partial<typeof EMPTY_POOL>) => ({ ...EMPTY_POOL, ...over });

describe('positiveDelta', () => {
  it('is null with no previous pool', () => {
    expect(positiveDelta(null, pool({ wood: 10 }))).toBeNull();
  });

  it('reports only the resources that grew', () => {
    const step = positiveDelta(pool({ wood: 10, food: 5, gold: 3 }), pool({ wood: 16, food: 5, gold: 1 }));
    expect(step).toEqual({ delta: { wood: 6 }, total: 6 });
  });

  it('is null when nothing grew', () => {
    expect(positiveDelta(pool({ wood: 10 }), pool({ wood: 10 }))).toBeNull();
    expect(positiveDelta(pool({ wood: 10 }), pool({ wood: 4 }))).toBeNull();
  });

  it('sums the total across resources', () => {
    const step = positiveDelta(pool({}), pool({ wood: 150, food: 40 }));
    expect(step).toEqual({ delta: { wood: 150, food: 40 }, total: 190 });
  });
});
