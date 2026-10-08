/**
 * Trade routes, in the store (BRDC-TRADEROUTE-001).
 *
 * The walk writer hands each batch of fixes here with the cells as they now stand; the
 * journey since the last Market is carried between batches, and a route made is kept —
 * one per pair of ends, the shorter walk winning. The gold is paid through the yield
 * model (`hexYield.ts`), so the card and the settle say the same.
 */
import { advanceJourney, routeActive, routeGold } from '../rules/tradeRoute.js';
import type { Journey, RouteEnd, TradeRoute } from '../rules/tradeRoute.js';
import { cityStates } from '../rules/cityState.js';
import { worksOn } from '../rules/build.js';
import { cellAt } from '../geo/cells.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerId, TrailPoint } from '../types/domain.js';

export const readRoutes = async (store: KeyValueStore): Promise<TradeRoute[]> => (await store.get<TradeRoute[]>(K.tradeRoutes)) ?? [];

/** Walk a batch on: carry the journey, keep any route it made. */
export async function noteJourney(store: KeyValueStore, points: readonly TrailPoint[], cellOf: (h3: H3Index) => Cell | undefined, me: PlayerId): Promise<void> {
  const doors = new Set(cityStates().map((c) => cellAt(c.door)));
  const endAt = (h3: H3Index): RouteEnd | null => {
    if (doors.has(h3)) return 'village';
    const cell = cellOf(h3);
    return cell?.ownerId === me && worksOn(cell).some((w) => w.id === 'market') ? 'market' : null;
  };
  const before = (await store.get<Journey>(K.tradeJourney)) ?? null;
  const { journey, made } = advanceJourney(before, points, endAt);
  if (journey) await store.set(K.tradeJourney, journey);
  else if (before) await store.delete(K.tradeJourney);
  if (made.length === 0) return;
  const routes = new Map((await readRoutes(store)).map((r) => [r.id, r]));
  for (const r of made) {
    const had = routes.get(r.id);
    if (!had || r.lengthM < had.lengthM) routes.set(r.id, r);
  }
  await store.set(K.tradeRoutes, [...routes.values()]);
}

export interface RouteRow extends TradeRoute {
  active: boolean;
  goldPerHour: number;
}

export interface TradeRouteApi {
  /** Every route walked this season, and whether its ends still hold. */
  view(now: number): Promise<RouteRow[]>;
}

export function tradeRouteApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): TradeRouteApi {
  return {
    async view(now) {
      const held = new Map((await owned(now)).map((c) => [c.h3, c]));
      return (await readRoutes(store())).map((r) => ({ ...r, active: routeActive(r, held), goldPerHour: routeGold(r.lengthM) }));
    },
  };
}

