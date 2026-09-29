import { describe, expect, it } from 'vitest';
import {
  DOOM_MAX,
  FOSSIL_MS,
  INTERREGNUM_MS,
  RECKONING_MS,
  advanceSeason,
  bossMaxHp,
  damageBoss,
  forcePhase,
  legacyMultiplier,
  openSeason,
  seasonDay,
  seasonIsPlayable,
} from './season.js';

const DAY = 86_400_000;
const T0 = 1_000_000;

describe('season', () => {
  it('counts days from 1', () => {
    const s = openSeason(2, 'The Low Water', 'seed', T0);
    expect(seasonDay(s, T0)).toBe(1);
    expect(seasonDay(s, T0 + DAY)).toBe(2);
  });

  it('stays open without Doom or deadline — the length is not fixed', () => {
    const s = openSeason(2, 'x', 'seed', T0);
    expect(advanceSeason(s, T0 + 100 * DAY, 6)).toBe(s);
  });

  it('wakes the Ancient One at Doom 13, strength 900 per realm', () => {
    const s = { ...openSeason(2, 'x', 'seed', T0), doomShift: DOOM_MAX };
    const r = advanceSeason(s, T0 + DAY, 6);
    expect(r.phase).toBe('reckoning');
    expect(r.bossHp).toBe(5_400);
    expect(bossMaxHp(0)).toBe(900);
  });

  it('wakes it on the deadline day when one is set', () => {
    const s = openSeason(2, 'x', 'seed', T0, 39);
    expect(advanceSeason(s, T0 + 37 * DAY, 6).phase).toBe('open');
    expect(advanceSeason(s, T0 + 38 * DAY, 6).phase).toBe('reckoning');
  });

  it('seals quiet when the boss falls, risen when 72 h run out', () => {
    const r = forcePhase(openSeason(2, 'x', 'seed', T0), 'reckoning', T0, 2);
    const fell = advanceSeason(damageBoss(r, 99_999), T0 + 1, 2);
    expect(fell).toMatchObject({ phase: 'sealed', outcome: 'quiet' });
    expect(advanceSeason(r, T0 + RECKONING_MS - 1, 2).phase).toBe('reckoning');
    expect(advanceSeason(r, T0 + RECKONING_MS, 2)).toMatchObject({ phase: 'sealed', outcome: 'risen' });
    expect(legacyMultiplier('quiet')).toBe(1.2);
    expect(legacyMultiplier('risen')).toBe(1);
  });

  it('walks sealed → interregnum → next, one step per call', () => {
    let s = forcePhase(openSeason(2, 'x', 'seed', T0), 'sealed', T0, 2);
    expect(seasonIsPlayable(s)).toBe(false);
    s = advanceSeason(s, T0 + FOSSIL_MS, 2);
    expect(s.phase).toBe('interregnum');
    s = advanceSeason(s, T0 + FOSSIL_MS + INTERREGNUM_MS, 2);
    expect(s.phase).toBe('next');
    expect(advanceSeason(s, T0 + 999 * DAY, 2)).toBe(s);
  });

  it('damage only lands during the Reckoning and never goes below 0', () => {
    const open = openSeason(2, 'x', 'seed', T0);
    expect(damageBoss(open, 50)).toBe(open);
    const r = forcePhase(open, 'reckoning', T0, 1);
    expect(damageBoss(r, 100).bossHp).toBe(800);
    expect(damageBoss(r, 5_000).bossHp).toBe(0);
    expect(damageBoss(r, -5)).toBe(r);
  });
});
