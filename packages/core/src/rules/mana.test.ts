/**
 * BRDC-MANA-001 — mana rates, temple expansion, and the dwell-gap it puts a price on.
 */
import { describe, expect, it } from 'vitest';
import {
  MANA_ANCHOR_RATE,
  MANA_TEMPLE_MIN,
  MANA_TEMPLE_RATE,
  MAX_TEMPLE_EXPANSION,
} from './constants.js';
import {
  ANCHOR_THRESHOLD_MS,
  MAX_DWELL_GAP_MS,
  TEMPLE_THRESHOLD_MS,
  accrueAll,
  revealPlaces,
} from './dwell.js';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { expandTemple, expansionCost, manaBonus, manaRate, placesWithMana } from './mana.js';
import type { Place } from './dwell.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-01T12:00:00Z');
const anchor: Place = { h3: 'a', kind: 'anchor', dwellMs: 99, rank: 0 };
const temple = (rank: number, h3 = `t${rank}`): Place => ({ h3, kind: 'temple', dwellMs: 99, rank });
const cell = (over: Partial<Cell> = {}): Cell => ({
  h3: 'a',
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});
const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

describe('manaRate', () => {
  it('the Anchor is the strongest base source', () => {
    expect(manaRate(anchor, 0)).toBe(MANA_ANCHOR_RATE);
    expect(manaRate(anchor, 0)).toBeGreaterThanOrEqual(manaRate(temple(1), 0));
  });

  it('a temple earns less the lower it ranks, and never nothing', () => {
    expect(manaRate(temple(1), 0)).toBe(MANA_TEMPLE_RATE);
    expect(manaRate(temple(1), 0)).toBeGreaterThan(manaRate(temple(2), 0));
    expect(manaRate(temple(20), 0)).toBe(MANA_TEMPLE_MIN);
  });

  it('expansion raises the rate, in whole units', () => {
    expect(manaRate(temple(1), 1)).toBeGreaterThan(manaRate(temple(1), 0));
    expect(manaRate(temple(1), 3)).toBeGreaterThan(manaRate(temple(1), 1));
    for (const n of [0, 1, 2, 3]) expect(Number.isInteger(manaRate(temple(1), n))).toBe(true);
  });
});

describe('expansionCost', () => {
  it('rises with each level', () => {
    expect(expansionCost(2).stone ?? 0).toBeGreaterThan(expansionCost(1).stone ?? 0);
    expect(expansionCost(2).gold ?? 0).toBeGreaterThan(expansionCost(1).gold ?? 0);
  });
});

describe('manaBonus', () => {
  it('sums the rate of every awake, held place', () => {
    const owned = [cell({ h3: 'a' }), cell({ h3: 't1' })];
    expect(manaBonus([anchor, temple(1)], {}, owned, T0)).toEqual({
      mana: manaRate(anchor, 0) + manaRate(temple(1), 0),
    });
  });

  it('skips a place whose cell has gone dormant', () => {
    const owned = [cell({ h3: 'a', lastVisitedAt: T0 - 10 * 86_400_000 })];
    expect(manaBonus([anchor], {}, owned, T0)).toEqual({});
  });

  it('skips a place the player does not hold', () => {
    expect(manaBonus([anchor], {}, [], T0)).toEqual({});
  });

  it('is empty when there are no places', () => {
    expect(manaBonus([], {}, [cell()], T0)).toEqual({});
  });

  it('counts a temple expansion', () => {
    expect(manaBonus([temple(1)], { t1: 2 }, [cell({ h3: 't1' })], T0)).toEqual({
      mana: manaRate(temple(1), 2),
    });
  });
});

describe('expandTemple', () => {
  it('raises the level one step and debits the rising cost', () => {
    const r = expandTemple(0, pool({ stone: 999, gold: 999 }));
    expect(r).toMatchObject({ ok: true, level: 1 });
    if (r.ok) {
      expect(r.pool.stone).toBe(999 - (expansionCost(1).stone ?? 0));
      expect(r.pool.gold).toBe(999 - (expansionCost(1).gold ?? 0));
    }
  });

  it('refuses at-max', () => {
    expect(expandTemple(MAX_TEMPLE_EXPANSION, pool({ stone: 999, gold: 999 }))).toEqual({
      ok: false,
      refused: 'at-max',
    });
  });

  it('refuses cannot-afford on a thin pool', () => {
    expect(expandTemple(0, pool({ stone: 1 }))).toEqual({ ok: false, refused: 'cannot-afford' });
  });

  it('never mutates the pool it was handed', () => {
    const p = pool({ stone: 999, gold: 999 });
    const snapshot = { ...p };
    expandTemple(0, p);
    expect(p).toEqual(snapshot);
  });
});

describe('placesWithMana', () => {
  it('attaches expansion and a rate to each place', () => {
    const t: Place = { h3: 't1', kind: 'temple', dwellMs: 1, rank: 1 };
    const [a, withT] = placesWithMana(
      [{ h3: 'a', kind: 'anchor', dwellMs: 1, rank: 0 }, t],
      { t1: 1 },
    );
    expect(a).toMatchObject({ expansion: 0, manaPerHour: MANA_ANCHOR_RATE });
    expect(withT).toMatchObject({ expansion: 1, manaPerHour: manaRate(t, 1) });
  });
});

describe('the dwell gap cannot be farmed into mana', () => {
  it('a phone left still for hours is credited the cap, not the wall clock', () => {
    // Two readings in one cell, eight hours apart. accrueDwell caps a same-cell gap at
    // MAX_DWELL_GAP_MS, so only forty minutes is credited — below even the Anchor
    // threshold, so nothing reveals and there is no place to draw mana from.
    const dwell = accrueAll({}, [
      { h3: 'bedroom', t: T0 },
      { h3: 'bedroom', t: T0 + 8 * 3_600_000 },
    ]);
    expect(dwell.bedroom).toBe(MAX_DWELL_GAP_MS);
    expect(MAX_DWELL_GAP_MS).toBeLessThan(ANCHOR_THRESHOLD_MS);
    expect(revealPlaces(dwell)).toEqual([]);
    expect(
      manaBonus(revealPlaces(dwell), {}, [cell({ h3: 'bedroom' })], T0 + 8 * 3_600_000),
    ).toEqual({});
  });

  it('reaching the temple threshold takes many returns, not one long gap', () => {
    // Even stacking the maximum credit per gap, the threshold needs several check-ins —
    // ceil(TEMPLE_THRESHOLD_MS / MAX_DWELL_GAP_MS) of them, i.e. actually being there.
    const gaps = Math.ceil(TEMPLE_THRESHOLD_MS / MAX_DWELL_GAP_MS);
    const readings = Array.from({ length: gaps + 1 }, (_, i) => ({
      h3: 'cafe',
      t: T0 + i * 8 * 3_600_000,
    }));
    expect(accrueAll({}, readings).cafe).toBe(gaps * MAX_DWELL_GAP_MS);
    expect(accrueAll({}, readings.slice(0, gaps)).cafe).toBeLessThan(TEMPLE_THRESHOLD_MS);
  });
});
