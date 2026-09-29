import { describe, expect, it } from 'vitest';
import { LORE, LORE_IDS, ageOf, canStudy, keepCeiling, loreAllows, loreCost, loreFor } from './lore.js';
import type { LoreId } from './lore.js';

describe('the Lore — five Ages, four paths', () => {
  it('has four techs in each of Ages I–IV, one per path', () => {
    for (const age of [1, 2, 3, 4] as const) {
      const here = LORE_IDS.filter((id) => LORE[id].age === age);
      expect(here).toHaveLength(4);
      expect(new Set(here.map((id) => LORE[id].path)).size).toBe(4);
    }
  });

  it('costs 30 / 80 / 160 / 280 wisdom by Age', () => {
    expect([1, 2, 3, 4].map((a) => loreCost(a as 1))).toEqual([30, 80, 160, 280]);
  });

  it('three of four enters the next Age', () => {
    expect(ageOf([])).toBe(1);
    expect(ageOf(['husbandry', 'woodcraft'])).toBe(1);
    const ageII: LoreId[] = ['husbandry', 'woodcraft', 'kindling'];
    expect(ageOf(ageII)).toBe(2);
    expect(ageOf([...ageII, 'granaries', 'stone-and-bellows', 'ley-reading'])).toBe(3);
  });

  it('seals what lies beyond the Age, refuses what is learned or unaffordable', () => {
    expect(canStudy('granaries', [], 999)).toEqual({ ok: false, refused: 'sealed' });
    expect(canStudy('husbandry', ['husbandry'], 999)).toEqual({ ok: false, refused: 'learned' });
    expect(canStudy('husbandry', [], 29)).toEqual({ ok: false, refused: 'cannot-afford' });
    expect(canStudy('husbandry', [], 30)).toEqual({ ok: true, cost: 30 });
  });

  it('gates buildings by the tech that opens them, and nothing else', () => {
    expect(loreFor('forge')).toBe('stone-and-bellows');
    expect(loreAllows('farm', [])).toBe(false);
    expect(loreAllows('farm', ['husbandry'])).toBe(true);
    expect(loreAllows('monument', [])).toBe(true);
  });

  it('Granaries lifts the Keep past level 2', () => {
    expect(keepCeiling([])).toBe(2);
    expect(keepCeiling(['husbandry', 'woodcraft', 'kindling', 'granaries'])).toBe(3);
  });
});
