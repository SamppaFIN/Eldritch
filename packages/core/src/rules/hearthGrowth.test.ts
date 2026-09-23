import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from './terrain.js';
import {
  HEARTH_FOOD_PER_HEX,
  HEARTH_MAX_RING,
  HEARTH_START_RING,
  growHearth,
  hearthRingCost,
} from './hearthGrowth.js';
import { BASE_STORAGE_CAP } from './terrain.js';

const pool = (food: number) => ({ ...EMPTY_POOL, food });

describe('hearthRingCost', () => {
  it('is 6·ring hexes at a fixed price each, dearer every ring', () => {
    expect(hearthRingCost(2)).toEqual({ food: 12 * HEARTH_FOOD_PER_HEX });
    expect(hearthRingCost(3).food).toBeGreaterThan(hearthRingCost(2).food as number);
  });

  it('keeps even the last ring under what the pouch can hold', () => {
    expect(hearthRingCost(HEARTH_MAX_RING).food as number).toBeLessThanOrEqual(BASE_STORAGE_CAP);
  });
});

describe('growHearth', () => {
  it('takes the food and moves the ring out by one', () => {
    const r = growHearth(pool(500), HEARTH_START_RING);
    expect(r).toMatchObject({ ok: true, ring: 2 });
    if (r.ok) expect(r.pool.food).toBe(500 - (hearthRingCost(2).food as number));
  });

  it('refuses, and takes nothing, when the food is not there', () => {
    const poor = pool(10);
    expect(growHearth(poor, 1)).toEqual({ ok: false, refused: 'cannot-afford' });
    expect(poor.food).toBe(10);
  });

  it('stops at the limit', () => {
    expect(growHearth(pool(500), HEARTH_MAX_RING)).toEqual({ ok: false, refused: 'at-limit' });
  });

  it('charges only for the hexes actually bought', () => {
    const r = growHearth(pool(500), 1, 5);
    if (r.ok) expect(r.pool.food).toBe(500 - 5 * HEARTH_FOOD_PER_HEX);
    const none = growHearth(pool(0), 1, 0);
    expect(none).toMatchObject({ ok: true, ring: 2 });
  });

  it('is paid in food and nothing else', () => {
    const r = growHearth({ ...EMPTY_POOL, wood: 500, food: 500 }, 1);
    if (r.ok) expect(r.pool.wood).toBe(500);
  });
});
