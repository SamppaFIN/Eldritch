import { describe, expect, it } from 'vitest';
import { TAVERN_CULTURE_PER_DAY, TAVERN_GOLD_PER_CULTURE, tavernTrade } from './tavernTrade.js';
import { EMPTY_POOL } from './terrain.js';

const rich = { ...EMPTY_POOL, gold: 500, culture: 3 };

describe('gold for culture at the Tavern (BRDC-TRADE-001)', () => {
  it('buys culture at the rate, one way', () => {
    const r = tavernTrade(rich, 4, 0);
    expect(r).toEqual({ ok: true, gold: 4 * TAVERN_GOLD_PER_CULTURE, pool: { ...rich, gold: 500 - 20, culture: 7 } });
  });

  it('the rate is poor: a culture costs more than one gold', () => {
    expect(TAVERN_GOLD_PER_CULTURE).toBeGreaterThan(1);
  });

  it('stops at the day’s cap, counting what was already bought', () => {
    expect(tavernTrade(rich, TAVERN_CULTURE_PER_DAY, 0).ok).toBe(true);
    expect(tavernTrade(rich, 1, TAVERN_CULTURE_PER_DAY)).toEqual({ ok: false, refused: 'cap' });
    expect(tavernTrade(rich, 5, TAVERN_CULTURE_PER_DAY - 4)).toEqual({ ok: false, refused: 'cap' });
  });

  it('never takes the pouch below zero, and refuses nothing or a fraction', () => {
    expect(tavernTrade({ ...EMPTY_POOL, gold: 4 }, 1, 0)).toEqual({ ok: false, refused: 'cannot-afford' });
    expect(tavernTrade(rich, 0, 0)).toEqual({ ok: false, refused: 'none' });
    expect(tavernTrade(rich, 1.5, 0)).toEqual({ ok: false, refused: 'none' });
  });
});
