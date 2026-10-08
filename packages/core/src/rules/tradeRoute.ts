/**
 * Trade routes, walked (BRDC-TRADEROUTE-001) — Civilization's trade routes made a walk:
 * leave one of your Markets and, in one walk, reach another of your Markets or a
 * village's door. The road you walked becomes a route that pays gold every hour, as long
 * as its ends hold. (Not `TRADE-001`, which is the Tavern's exchange rate.)
 *
 * One walk means no pause longer than half an hour, and no more than two kilometres from
 * the Market it began at. Every Market walked through starts the count again, so the
 * route is the stretch since the last Market.
 *
 * Pure. The store carries the journey between walk batches (`tradeRouteStore.ts`).
 */
import { cellAt } from '../geo/cells.js';
import { haversine } from '../geo/haversine.js';
import type { Cell, H3Index, LatLng, TrailPoint } from '../types/domain.js';
import { worksOn } from './build.js';

export const ROUTE_MAX_M = 2_000;
export const ROUTE_GAP_MS = 30 * 60_000;
export const ROUTE_GOLD_BASE = 2;
export const ROUTE_GOLD_PER_KM = 1;

export type RouteEnd = 'market' | 'village';

export interface Journey {
  from: H3Index;
  lengthM: number;
  last: LatLng;
  lastT: number;
}

export interface TradeRoute {
  /** The two ends, sorted: one route per pair. */
  id: string;
  a: H3Index;
  b: H3Index;
  lengthM: number;
  toVillage: boolean;
  at: number;
}

export const routeId = (a: H3Index, b: H3Index): string => (a < b ? `${a}~${b}` : `${b}~${a}`);

/** Walk the points on from the journey so far: the journey after them, and any route made. */
export function advanceJourney(
  journey: Journey | null,
  points: readonly TrailPoint[],
  endAt: (h3: H3Index) => RouteEnd | null,
): { journey: Journey | null; made: TradeRoute[] } {
  let j = journey;
  const made: TradeRoute[] = [];
  for (const p of points) {
    if (j) {
      const lengthM = j.lengthM + haversine(j.last, p);
      j = p.t - j.lastT > ROUTE_GAP_MS || lengthM > ROUTE_MAX_M ? null : { ...j, lengthM, last: p, lastT: p.t };
    }
    const h3 = cellAt(p);
    const end = endAt(h3);
    if (end && j && h3 !== j.from) {
      made.push({ id: routeId(j.from, h3), a: j.from, b: h3, lengthM: Math.round(j.lengthM), toVillage: end === 'village', at: p.t });
      j = null; // arrived: a village ends the journey, a Market starts the next one just below
    }
    if (end === 'market' && j?.from !== h3) j = { from: h3, lengthM: 0, last: p, lastT: p.t };
  }
  return { journey: j, made };
}

/** Gold an hour a route pays: 2, and 1 more for every kilometre. */
export const routeGold = (lengthM: number): number => ROUTE_GOLD_BASE + (ROUTE_GOLD_PER_KM * lengthM) / 1000;

const holdsMarket = (cell: Cell | undefined): boolean => !!cell && worksOn(cell).some((w) => w.id === 'market');

/** A route pays while its Markets are yours — a village end is always there. */
export function routeActive(route: TradeRoute, owned: ReadonlyMap<H3Index, Cell>): boolean {
  return holdsMarket(owned.get(route.a)) && (route.toVillage || holdsMarket(owned.get(route.b)));
}

/** The gold every live route pays an hour. */
export function routesGold(routes: readonly TradeRoute[], owned: readonly Cell[]): number {
  const held = new Map(owned.map((c) => [c.h3, c]));
  return routes.filter((r) => routeActive(r, held)).reduce((s, r) => s + routeGold(r.lengthM), 0);
}
