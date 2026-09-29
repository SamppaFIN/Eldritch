import { describe, expect, it } from 'vitest';
import { BALANCE, affordableClaims, claimCost, claimsCost, copyCost, growBox, housing, slots } from './balance.js';
import { FIRST_GRANARY, FIRST_KEEP, feedGranary, foodBalance, hoursToNextCitizen, settleGranary } from './citizens.js';

describe('balance — the document\'s own worked numbers', () => {
  it('growBox: 29 at 1, 365 at 15', () => {
    expect(growBox(1)).toBe(29);
    expect(growBox(15)).toBe(365);
  });
  it('housing 3 + 3 per Keep level; slots 1, 2, 2, 3, 3', () => {
    expect(housing(2)).toBe(9);
    expect([0, 1, 2, 3, 4].map(slots)).toEqual([1, 1, 2, 2, 3]);
    expect([1, 2, 3, 4, 5].map(slots)).toEqual([1, 2, 2, 3, 3]);
  });
  it('claimCost 50 at 10, 277 at 50; the fifth copy costs 2.4×', () => {
    expect(claimCost(10)).toBe(50);
    expect(claimCost(50)).toBe(277);
    expect(copyCost(100, 5)).toBe(244);
  });
});

describe('settleGranary', () => {
  it('a citizen eats 2 food an hour', () => {
    expect(foodBalance(15 + 3, 7)).toBe(4);
  });

  it('fills the box, and a full box is a citizen and an empty box', () => {
    const r = settleGranary(FIRST_GRANARY, 10, 2.9, 9); // 29 food = growBox(1)
    expect(r.born).toBe(1);
    expect(r.granary).toEqual({ citizens: 2, box: 0, starvedH: 0 });
  });

  it('several can be born in one long span, each box dearer than the last', () => {
    const food = growBox(1) + growBox(2) + 5;
    const r = settleGranary(FIRST_GRANARY, food, 1, 9);
    expect(r.born).toBe(2);
    expect(r.granary.box).toBe(5);
  });

  it('a full Keep stops growth; the surplus is stored', () => {
    const full = { citizens: 9, box: 0, starvedH: 0 };
    const r = settleGranary(full, 100, 10, 9);
    expect(r.born).toBe(0);
    expect(r.granary.box).toBe(growBox(9));
    expect(r.stored).toBe(1000 - growBox(9));
  });

  it('hunger drains the box first, then after 6 h at zero one leaves', () => {
    const g = { citizens: 5, box: 20, starvedH: 0 };
    const drained = settleGranary(g, -4, 5, 9);
    expect(drained.granary).toEqual({ citizens: 5, box: 0, starvedH: 0 });
    const starving = settleGranary(g, -4, 5 + BALANCE.starveGraceH, 9);
    expect(starving.left).toBe(1);
    expect(starving.granary.citizens).toBe(4);
    expect(starving.granary.starvedH).toBeCloseTo(0);
  });

  it('a fed hour clears the starvation clock', () => {
    const r = settleGranary({ citizens: 3, box: 0, starvedH: 5 }, 1, 1, 9);
    expect(r.granary.starvedH).toBe(0);
  });

  it('says when the next citizen comes, or that none is', () => {
    expect(hoursToNextCitizen({ citizens: 7, box: 81, starvedH: 0 }, 4, 9)).toBe((125 - 81) / 4);
    expect(hoursToNextCitizen(FIRST_GRANARY, 0, 9)).toBeNull();
    expect(hoursToNextCitizen({ citizens: 9, box: 0, starvedH: 0 }, 4, 9)).toBeNull();
  });
});

describe('feedGranary — granary first', () => {
  const H = 3_600_000;
  const before = { pool: { food: 40 }, since: 0 };

  it('leaves a Season 1 save (no keep) exactly as settled', () => {
    const after = { pool: { food: 70 }, since: 3 * H };
    expect(feedGranary(before, after)).toBe(after);
  });

  it('turns the food produced into the granary, not the pouch', () => {
    // 3 h at 12 food/h, one citizen eating 2: +30 into the box, none to the pouch.
    const r = feedGranary({ ...before, keep: FIRST_KEEP }, { pool: { food: 76 }, since: 3 * H, keep: FIRST_KEEP });
    expect(r.pool.food).toBe(40);
    expect(r.keep?.granary).toEqual({ citizens: 2, box: 1, starvedH: 0 });
  });

  it('a full Keep sends the surplus to the pouch', () => {
    const full = { level: 1, granary: { citizens: 6, box: 0, starvedH: 0 } };
    const r = feedGranary({ ...before, keep: full }, { pool: { food: 1040 }, since: 10 * H, keep: full });
    expect(r.keep?.granary.citizens).toBe(6);
    expect(r.pool.food).toBe(40 + 1000 - 10 * 12 - growBox(6));
  });
});

describe('culture buys ground (PROG-003)', () => {
  it('buys cells in order, each dearer, never overspending', () => {
    const held = 7; // the founding Hearth ring
    const one = claimCost(8);
    expect(affordableClaims(one - 1, held)).toEqual({ count: 0, cost: 0 });
    expect(affordableClaims(one, held)).toEqual({ count: 1, cost: one });
    const two = claimsCost(held, 2);
    expect(two).toBe(claimCost(8) + claimCost(9));
    expect(affordableClaims(two + claimCost(10) - 1, held)).toEqual({ count: 2, cost: two });
  });
});
