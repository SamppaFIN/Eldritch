import { describe, expect, it } from 'vitest';
import { BASE_STRENGTH, MAX_STRENGTH } from './constants.js';
import { projectCell } from './decay.js';
import { EMPTY_POOL } from './terrain.js';
import { WARD_COST, WARD_STRENGTH, ward, wardsAffordable } from './ward.js';
import type { Cell } from '../types/domain.js';

const ME = 'me';
const RIVAL = 'the-pale-warden';
const T0 = Date.parse('2026-08-28T09:00:00Z');
const DAY = 86_400_000;

const rich = { ...EMPTY_POOL, food: 100, wood: 100, gold: 100 };
const cell = (over: Partial<Cell> = {}): Cell => ({
  h3: '8b1fb46622dafff',
  ownerId: ME,
  strength: BASE_STRENGTH,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});

describe('ward', () => {
  it('raises strength and takes the cost', () => {
    const result = ward(cell(), rich, ME);
    expect(result.warded).toBe(true);
    if (!result.warded) return;

    expect(result.cell.strength).toBe(BASE_STRENGTH + WARD_STRENGTH);
    expect(result.pool.wood).toBe(rich.wood - (WARD_COST.wood ?? 0));
    // Only what the cost names is taken.
    expect(result.pool.food).toBe(rich.food);
    expect(result.pool.gold).toBe(rich.gold);
  });

  it('does not move the decay clock', () => {
    /*
     * The rule the whole mechanic balances on. Resources buy a cell more time; they must
     * never buy it immunity, or a player who stops walking keeps their map forever and
     * this stops being a game about walking.
     */
    const before = cell();
    const result = ward(before, rich, ME);
    if (!result.warded) throw new Error('expected a ward');

    expect(result.cell.lastVisitedAt).toBe(before.lastVisitedAt);
  });

  it('buys time against decay, not safety from it', () => {
    const plain = cell();
    const warded = ward(plain, rich, ME);
    if (!warded.warded) throw new Error('expected a ward');

    /*
     * Thirteen days untouched. An unwarded cell at base strength is gone by day twelve;
     * the warded one is still standing — and still losing ten a day, which is the half
     * of this that matters. Resources delay the Void, they do not argue with it.
     */
    const late = T0 + 13 * DAY;

    expect(projectCell(plain, late)).toBeNull();

    const survivor = projectCell(warded.cell, late);
    expect(survivor).not.toBeNull();
    expect(survivor?.strength).toBeLessThan(warded.cell.strength);
  });

  it('cannot be stacked into immortality', () => {
    // Even a cell warded to the cap is released eventually without a visit. The pouch
    // is not a substitute for walking; it is a stay of execution.
    let held = cell({ strength: MAX_STRENGTH });
    expect(projectCell(held, T0 + 60 * DAY)).toBeNull();

    held = { ...held, strength: MAX_STRENGTH - WARD_STRENGTH };
    const result = ward(held, rich, ME);
    if (!result.warded) throw new Error('expected a ward');
    expect(projectCell(result.cell, T0 + 60 * DAY)).toBeNull();
  });

  it('refuses a cell belonging to someone else', () => {
    expect(ward(cell({ ownerId: RIVAL }), rich, ME)).toEqual({
      warded: false,
      refused: 'not-yours',
    });
  });

  it('refuses unowned ground', () => {
    expect(ward(cell({ ownerId: null }), rich, ME)).toEqual({
      warded: false,
      refused: 'not-yours',
    });
  });

  it('refuses a cell that is already at full strength', () => {
    expect(ward(cell({ strength: MAX_STRENGTH }), rich, ME)).toEqual({
      warded: false,
      refused: 'already-full',
    });
  });

  it('refuses when the pouch is short by one', () => {
    const poor = { ...rich, wood: (WARD_COST.wood ?? 0) - 1 };
    expect(ward(cell(), poor, ME)).toEqual({ warded: false, refused: 'cannot-afford' });
  });

  it('never pushes a cell past the cap', () => {
    const nearly = cell({ strength: MAX_STRENGTH - 1 });
    const result = ward(nearly, rich, ME);
    if (!result.warded) throw new Error('expected a ward');
    expect(result.cell.strength).toBe(MAX_STRENGTH);
  });

  it('leaves the pool it was given untouched', () => {
    const pool = { ...rich };
    ward(cell(), pool, ME);
    expect(pool).toEqual(rich);
  });
});

describe('wardsAffordable', () => {
  it('is nothing on an empty pouch', () => {
    expect(wardsAffordable(EMPTY_POOL)).toBe(0);
  });

  it('is limited by the resources the cost actually names', () => {
    // Gold and food are irrelevant to a ward, however much of them there is.
    expect(wardsAffordable({ ...EMPTY_POOL, food: 1000, gold: 1000 })).toBe(0);
  });

  it('counts exact change as one ward', () => {
    expect(wardsAffordable({ ...EMPTY_POOL, wood: WARD_COST.wood ?? 0 })).toBe(1);
  });

  it('counts how many a full pouch could pay for', () => {
    expect(wardsAffordable({ ...EMPTY_POOL, wood: (WARD_COST.wood ?? 0) * 3 + 1 })).toBe(3);
  });
});
