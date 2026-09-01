/**
 * BRDC-BUILD-004 — the Trade Route placement rule and the gold it pays.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, hexDistance, neighboursOf } from '../geo/cells.js';
import { DEMOLISH_REFUND, TRADE_ROUTE_COST, TRADE_ROUTE_GOLD, TRADE_ROUTE_MAX_HEXES } from './constants.js';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { canLayRoute, routeGoldBonus, routeRefund, sameLink } from './trade.js';
import type { TradeRoute } from './trade.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-01T12:00:00Z');
const A = cellAt({ lat: 61.4729, lng: 23.7259 });
const B = neighboursOf(A)[0] as string;
const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });
const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});
const RICH = pool({ ...TRADE_ROUTE_COST });
const owned = [cell(A), cell(B)];

describe('canLayRoute', () => {
  it('binds two held cells within range', () => {
    expect(canLayRoute('me', A, B, owned, [], RICH)).toEqual({ ok: true });
  });

  it('refuses in order — same cell, ownership, distance, duplication, cost', () => {
    expect(canLayRoute('me', A, A, owned, [], RICH)).toEqual({ ok: false, refused: 'same-cell' });
    expect(canLayRoute('me', A, B, [cell(A)], [], RICH)).toEqual({ ok: false, refused: 'not-yours' });

    // A cell far enough away that hexDistance exceeds the cap.
    const far = cellAt({ lat: 61.4729 + 0.01, lng: 23.7259 + 0.01 });
    expect(hexDistance(A, far)).toBeGreaterThan(TRADE_ROUTE_MAX_HEXES);
    expect(canLayRoute('me', A, far, [...owned, cell(far)], [], RICH)).toEqual({
      ok: false,
      refused: 'too-far',
    });

    const existing: TradeRoute[] = [{ a: B, b: A, builtAt: T0 }];
    expect(canLayRoute('me', A, B, owned, existing, RICH)).toEqual({
      ok: false,
      refused: 'already-linked',
    });

    expect(canLayRoute('me', A, B, owned, [], pool({ stone: 1 }))).toEqual({
      ok: false,
      refused: 'cannot-afford',
    });
  });
});

describe('sameLink', () => {
  it('matches a route regardless of endpoint order', () => {
    const r: TradeRoute = { a: A, b: B, builtAt: T0 };
    expect(sameLink(r, A, B)).toBe(true);
    expect(sameLink(r, B, A)).toBe(true);
    expect(sameLink(r, A, 'other')).toBe(false);
  });
});

describe('routeGoldBonus', () => {
  const routes: TradeRoute[] = [{ a: A, b: B, builtAt: T0 }];

  it('pays per route while both ends are awake', () => {
    expect(routeGoldBonus(routes, owned, T0)).toEqual({ gold: TRADE_ROUTE_GOLD });
    expect(routeGoldBonus([...routes, { a: A, b: B, builtAt: T0 }], owned, T0)).toEqual({
      gold: 2 * TRADE_ROUTE_GOLD,
    });
  });

  it('skips a route with a dormant end, and is empty with none', () => {
    const stale = [cell(A), cell(B, { lastVisitedAt: T0 - 10 * 86_400_000 })];
    expect(routeGoldBonus(routes, stale, T0)).toEqual({});
    expect(routeGoldBonus([], owned, T0)).toEqual({});
  });
});

describe('routeRefund', () => {
  it('hands back half the cost, floored', () => {
    const back = routeRefund();
    expect(back.stone).toBe(Math.floor((TRADE_ROUTE_COST.stone as number) * DEMOLISH_REFUND));
    expect(back.gold).toBe(Math.floor((TRADE_ROUTE_COST.gold as number) * DEMOLISH_REFUND));
  });
});
