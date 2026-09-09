/**
 * Paying back what the one-per-cell migration took down (PIVOT-2026-09-09 §6).
 *
 * Schema 3 → 4 leaves one Work standing on each hex. Every other Work a player had built
 * is gone, and they never chose that — so this is the half of the change that faces them:
 * the full build cost comes back, one log line names each Work, and the list is handed
 * to the app so it can say out loud what happened. Then the key is deleted; it is a
 * one-shot, not a standing balance.
 *
 * Full cost, not the half a chosen demolition pays (`demolishOn`). The halving is the
 * price of changing your mind; nobody changed their mind here.
 */
import { buildCost } from '../rules/build.js';
import type { BuildingId } from '../rules/build.js';
import type { ResourceKind } from '../rules/terrain.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

/**
 * Hand back what the migration razed, once. `[]` when there is nothing owed — which is
 * every open but the first one after the upgrade.
 */
export async function takeRazed(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
): Promise<BuildingId[]> {
  const razed = (await store.get<BuildingId[]>(K.razed)) ?? [];
  if (razed.length === 0) return [];

  // Settle first: the trickle owed up to this moment is banked before anything is added,
  // the same order every other credit to the pouch takes.
  const state = await settlePouch(store, owned, now);
  const pool = { ...state.pool };
  for (const id of razed) {
    for (const [k, v] of Object.entries(buildCost(id)) as [ResourceKind, number][]) {
      pool[k] += v;
    }
    await writeLogEntry(store, { at: now, kind: 'demolish', ref: id });
  }
  await writePouch(store, pool, now);
  await store.delete(K.razed);
  return razed;
}
