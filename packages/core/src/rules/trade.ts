/**
 * Trade Routes (BRDC-BUILD-004).
 *
 * Every other building sits on one cell. A Trade Route binds two: both ends held, within
 * a few hexes of each other, and while both are awake the pair pays gold every hour. It
 * lives in its own store (`K.tradeRoutes`), not in `cell.building`, because there is no
 * single cell to hang it on.
 *
 * Pure: `canLayRoute` is the placement rule (`ward.ts`'s shape), `routeGoldBonus` is what
 * `perHourBonus` folds in, `routeRefund` is what demolishing hands back.
 */
import { hexDistance } from '../geo/cells.js';
import {
  DECAY_GRACE_HOURS,
  DEMOLISH_REFUND,
  TRADE_ROUTE_COST,
  TRADE_ROUTE_GOLD,
  TRADE_ROUTE_MAX_HEXES,
} from './constants.js';
import { canAfford } from './terrain.js';
import type { ResourceKind, ResourcePool } from './terrain.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export interface TradeRoute {
  a: H3Index;
  b: H3Index;
  builtAt: number;
}

export type RouteRefusal =
  | 'same-cell'
  | 'not-yours'
  | 'too-far'
  | 'already-linked'
  | 'cannot-afford';

export type RouteCheck = { ok: true } | { ok: false; refused: RouteRefusal };

const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;
const COST = TRADE_ROUTE_COST as Readonly<Partial<ResourcePool>>;

/** The cost to lay one, as a pool cost. */
export function routeCost(): Readonly<Partial<ResourcePool>> {
  return COST;
}

/** Half the cost back, floored per resource — the same stance as `build.ts#refund`. */
export function routeRefund(): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const [k, v] of Object.entries(COST) as [ResourceKind, number][]) {
    out[k] = Math.floor(v * DEMOLISH_REFUND);
  }
  return out;
}

/** Is `a`↔`b` a legal new route for this player? Ordered most-fundamental first. */
export function canLayRoute(
  me: PlayerId,
  a: H3Index,
  b: H3Index,
  owned: readonly Cell[],
  routes: readonly TradeRoute[],
  pool: ResourcePool,
): RouteCheck {
  if (a === b) return { ok: false, refused: 'same-cell' };

  const held = new Set(owned.filter((c) => c.ownerId === me).map((c) => c.h3));
  if (!held.has(a) || !held.has(b)) return { ok: false, refused: 'not-yours' };

  if (hexDistance(a, b) > TRADE_ROUTE_MAX_HEXES) return { ok: false, refused: 'too-far' };

  if (routes.some((r) => sameLink(r, a, b))) return { ok: false, refused: 'already-linked' };

  if (!canAfford(pool, COST)) return { ok: false, refused: 'cannot-afford' };

  return { ok: true };
}

/** Two endpoints name the same route regardless of order. */
export function sameLink(route: TradeRoute, a: H3Index, b: H3Index): boolean {
  return (route.a === a && route.b === b) || (route.a === b && route.b === a);
}

/**
 * Gold per hour from every route whose *both* ends are awake ground the player holds.
 *
 * Dormancy-filtered like `buildingBonus` — a route to a cell nobody has walked in 48 h
 * stops paying. `{}` when nothing qualifies.
 */
export function routeGoldBonus(
  routes: readonly TradeRoute[],
  owned: readonly Cell[],
  now: number,
): Partial<ResourcePool> {
  const awake = new Set(
    owned.filter((c) => now - c.lastVisitedAt <= DORMANT_AFTER_MS).map((c) => c.h3),
  );
  const live = routes.filter((r) => awake.has(r.a) && awake.has(r.b)).length;
  return live > 0 ? { gold: live * TRADE_ROUTE_GOLD } : {};
}
