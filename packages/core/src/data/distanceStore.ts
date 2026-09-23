/**
 * A route-mode save's lifetime distance (BRDC-MODE-002).
 *
 * Unlike `Run.distanceM` (which starts over on every fresh run, and unlike `leyM`
 * (`geo/paths.ts`'s own distinct-ground figure, deliberately deduplicated so laps do
 * not inflate it), this is a plain running total: every metre `submitWalk` accepts,
 * added once and never pruned. The Route's own leaderboard is scored on it, so the
 * whole point is that walking the same block twice counts twice.
 */
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

export async function addRouteDistance(store: KeyValueStore, metres: number): Promise<number> {
  if (metres <= 0) return readRouteDistance(store);
  const after = (await readRouteDistance(store)) + metres;
  await store.set(K.routeDistanceM, after);
  return after;
}

export async function readRouteDistance(store: KeyValueStore): Promise<number> {
  return (await store.get<number>(K.routeDistanceM)) ?? 0;
}
