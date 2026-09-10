/**
 * BRDC-DIPLO-001 — city states are placed, not played; trade costs a quarter.
 */
import { describe, expect, it } from 'vitest';
import { CITY_STATES, TRADE_LOSS, TRADE_PARCEL, cityStateById, cityStateOf, isCityState, trade, tradeReturn } from './cityState.js';
import { EMPTY_POOL, MAX_STRENGTH } from './index.js';
import type { ResourcePool } from './terrain.js';

const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

describe('the table', () => {
  it('gives every city state a door, ground to hold and a name', () => {
    for (const c of CITY_STATES) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.radius).toBeGreaterThan(0);
      expect(c.door).toBeTruthy();
    }
  });

  /*
   * A city state's ground is at full strength: the watchtowers of the brief, expressed in
   * the number the siege model already reads rather than as a building nobody can build.
   */
  it('holds its ground at full strength', () => {
    for (const c of CITY_STATES) expect(c.strength).toBe(MAX_STRENGTH);
  });

  // Prefixed so it can never collide with a player uuid, however many players there are.
  it('owns its cells under an id no player can have', () => {
    for (const c of CITY_STATES) expect(c.owner.startsWith('city:')).toBe(true);
  });

  it('is found by id and by owner, and nothing else is', () => {
    const first = CITY_STATES[0];
    if (!first) return;
    expect(cityStateById(first.id)?.owner).toBe(first.owner);
    expect(cityStateOf(first.owner)?.id).toBe(first.id);
    expect(cityStateOf('some-player-uuid')).toBeUndefined();
    expect(isCityState(first.owner)).toBe(true);
    expect(isCityState(null)).toBe(false);
  });
});

describe('trade', () => {
  it('swaps a parcel and takes a quarter', () => {
    const r = trade(pool({ wood: 100 }), 'wood', 'food');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.gave).toBe(TRADE_PARCEL);
    expect(r.got).toBe(TRADE_PARCEL * (1 - TRADE_LOSS));
    expect(r.pool.wood).toBe(100 - TRADE_PARCEL);
    expect(r.pool.food).toBe(r.got);
  });

  /*
   * The loss is the whole reason a trade post is a choice rather than a button pressed in
   * a loop: converting back and forth has to leave you with less than you started.
   */
  it('loses on a round trip, so it cannot be farmed', () => {
    const out = trade(pool({ wood: 100 }), 'wood', 'food');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const back = trade({ ...out.pool, food: out.pool.food }, 'food', 'wood', out.got);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.pool.wood).toBeLessThan(100);
  });

  it('refuses before taking anything', () => {
    const thin = pool({ wood: 5 });
    const r = trade(thin, 'wood', 'food');
    expect(r).toEqual({ ok: false, refused: 'cannot-afford' });
    expect(thin.wood).toBe(5);
  });

  it('will not swap a thing for itself', () => {
    expect(trade(pool({ wood: 100 }), 'wood', 'wood')).toEqual({
      ok: false,
      refused: 'same-resource',
    });
  });

  it('refuses an empty parcel rather than paying out of nowhere', () => {
    expect(trade(pool({ wood: 100 }), 'wood', 'food', 0)).toEqual({
      ok: false,
      refused: 'nothing-to-give',
    });
  });

  it('never mints a fraction — whole units, like every other rate', () => {
    for (let n = 1; n <= 40; n += 1) expect(Number.isInteger(tradeReturn(n))).toBe(true);
  });

  it('leaves the pouch it was given untouched', () => {
    const before = pool({ wood: 100, food: 10 });
    trade(before, 'wood', 'food');
    expect(before).toEqual(pool({ wood: 100, food: 10 }));
  });
});
