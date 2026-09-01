/**
 * The walked-path store (BRDC-TRAIL-003).
 *
 * Its own key, deliberately not under `K.trail(runId)`: the live ley-line belongs to one
 * run and is trimmed when a loop closes, but where a player walks is a record that has to
 * outlast every run. The segmentation, tiering and pruning are pure (`geo/paths.js`);
 * this is only the read and the batched write, done in the same pass `recordWalk` already
 * writes cells and dwell.
 */
import { bankEdges, prunePaths, trailEdges } from '../geo/paths.js';
import type { PathSegment } from '../geo/paths.js';
import { MAX_PATH_SEGMENTS } from '../rules/constants.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { LatLng } from '../types/domain.js';

export async function readPaths(store: KeyValueStore): Promise<Record<string, PathSegment>> {
  return (await store.get<Record<string, PathSegment>>(K.paths)) ?? {};
}

/**
 * Bank a batch of walked points: one visit for every segment it crosses, pruned to the cap.
 *
 * A no-op for a batch that never left one segment — standing still wears nothing.
 */
export async function recordPaths(
  store: KeyValueStore,
  points: readonly LatLng[],
  now: number,
): Promise<void> {
  const edges = trailEdges(points);
  if (edges.length === 0) return;
  const banked = bankEdges(await readPaths(store), edges, now);
  await store.set(K.paths, prunePaths(banked, MAX_PATH_SEGMENTS));
}
