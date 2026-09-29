import { describe, expect, it } from 'vitest';
import { BALANCE, claimCost, copyCost, growBox, housing, slots } from './balance.js';
import { FIRST_GRANARY, foodBalance, hoursToNextCitizen, settleGranary } from './citizens.js';

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
