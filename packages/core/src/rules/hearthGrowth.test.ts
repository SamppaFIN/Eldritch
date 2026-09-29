import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from './terrain.js';
import { HEARTH_FOOD_PER_HEX, HEARTH_MAX_RING, HEARTH_START_RING, growHearth } from './hearthGrowth.js';

const pool = (food: number) => ({ ...EMPTY_POOL, food });

describe('growHearth (100 food a hex, since 2026-09-29)', () => {
  it('is twenty times the first price', () => {
    expect(HEARTH_FOOD_PER_HEX).toBe(100);
  });

  it('buys what the food covers and stays on the ring until it is full', () => {
    const r = growHearth(pool(500), HEARTH_START_RING, 12);
    expect(r).toMatchObject({ ok: true, ring: 1, bought: 5 });
    if (r.ok) expect(r.pool.food).toBe(0);
  });

  it('reaches the ring with the last hex bought', () => {
    const r = growHearth(pool(500), 1, 2);
    expect(r).toMatchObject({ ok: true, ring: 2, bought: 2 });
    if (r.ok) expect(r.pool.food).toBe(300);
  });

  it('refuses, and takes nothing, below the price of one hex', () => {
    const poor = pool(99);
    expect(growHearth(poor, 1, 12)).toEqual({ ok: false, refused: 'cannot-afford' });
    expect(poor.food).toBe(99);
  });

  it('a ring already all held is reached for nothing', () => {
    expect(growHearth(pool(0), 1, 0)).toMatchObject({ ok: true, ring: 2, bought: 0 });
  });

  it('stops at the limit', () => {
    expect(growHearth(pool(500), HEARTH_MAX_RING, 12)).toEqual({ ok: false, refused: 'at-limit' });
  });

  it('is paid in food and nothing else', () => {
    const r = growHearth({ ...EMPTY_POOL, wood: 500, food: 500 }, 1, 12);
    if (r.ok) expect(r.pool.wood).toBe(500);
  });
});
