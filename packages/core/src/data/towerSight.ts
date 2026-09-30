/**
 * How far a Watchtower sees (field report 2026-09-30: *"watch towerin pitäisi antaa sinulle
 * 2 radius näkyvyys ilman asukasta ja x näkyvyys jos siellä on worker"*).
 *
 * Two rings standing empty, one more for every hand in it, and whatever its Works tree's
 * reach adds (Lookout, Second Platform, Spyglass). What it sees stays seen.
 */
import { WORKS_DEFS } from '../rules/works/defs/index.js';
import { reachRings } from '../rules/works/tree.js';
import { staffKey } from '../rules/staffing.js';
import type { ResourceState } from '../rules/terrain.js';
import { sightRings } from './revealStore.js';
import { readTrees } from './worksTrees.js';
import type { KeyValueStore } from './kv.js';
import type { H3Index } from '../types/domain.js';

export const TOWER_SIGHT = 2;

export function towerRings(hands: number, reach: number): number {
  return TOWER_SIGHT + hands + reach;
}

export async function towerSight(store: KeyValueStore, h3: H3Index, now: number): Promise<void> {
  const keep = (await store.get<ResourceState>('resources'))?.keep;
  const hands = keep?.staff?.[staffKey(h3, 'watchtower')] ?? 0;
  const reach = reachRings(WORKS_DEFS.watchtower, (await readTrees(store))[h3] ?? []);
  await sightRings(store, h3, towerRings(hands, reach), now);
}
