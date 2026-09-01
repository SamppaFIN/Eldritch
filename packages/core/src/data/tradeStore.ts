/**
 * Trade Routes, in the store (BRDC-BUILD-004).
 *
 * The placement rule and the gold it pays are pure (`rules/trade.js`); this is the seam
 * that touches the store, beside `templeStore.js` and `spellStore.js`. A route lives in
 * `K.tradeRoutes`, not `cell.building` — it is the one building bound to two cells.
 */
import { canLayRoute, routeCost, routeRefund, sameLink } from '../rules/trade.js';
import type { RouteRefusal, TradeRoute } from '../rules/trade.js';
import { spend } from '../rules/terrain.js';
import type { ResourceKind } from '../rules/terrain.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export type RouteOutcome =
  | { ok: true; route: TradeRoute }
  | { ok: false; refused: RouteRefusal | 'no-such-route' };

export async function readRoutes(store: KeyValueStore): Promise<TradeRoute[]> {
  return (await store.get<TradeRoute[]>(K.tradeRoutes)) ?? [];
}

/** Lay `a`↔`b`, paying stone and gold. Settles first; writes only on success. */
export async function layRouteAt(
  store: KeyValueStore,
  me: PlayerId,
  a: H3Index,
  b: H3Index,
  owned: readonly Cell[],
  now: number,
): Promise<RouteOutcome> {
  const state = await settlePouch(store, owned, now);
  const routes = await readRoutes(store);
  const check = canLayRoute(me, a, b, owned, routes, state.pool);
  if (!check.ok) return check;

  const paid = spend(state.pool, routeCost());
  if (!paid) return { ok: false, refused: 'cannot-afford' };
  await writePouch(store, paid, now);

  const route: TradeRoute = { a, b, builtAt: now };
  await store.set(K.tradeRoutes, [...routes, route]);
  return { ok: true, route };
}

/** Tear down `a`↔`b` and hand back half its cost. */
export async function removeRouteAt(
  store: KeyValueStore,
  a: H3Index,
  b: H3Index,
  owned: readonly Cell[],
  now: number,
): Promise<RouteOutcome> {
  const routes = await readRoutes(store);
  const gone = routes.find((r) => sameLink(r, a, b));
  if (!gone) return { ok: false, refused: 'no-such-route' };

  const state = await settlePouch(store, owned, now);
  const pool = { ...state.pool };
  for (const [k, v] of Object.entries(routeRefund()) as [ResourceKind, number][]) pool[k] += v;
  await writePouch(store, pool, now);

  await store.set(
    K.tradeRoutes,
    routes.filter((r) => !sameLink(r, a, b)),
  );
  return { ok: true, route: gone };
}
