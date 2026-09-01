/**
 * Run lifecycle, in the store.
 *
 * Pulled out of MockRepository once it neared the 400-line limit — plain CRUD on
 * `K.run` / `K.activeRun` / `K.trail`, no rules of its own. The heavy part of a run
 * (validating and closing a walk) is already `walkFlow.js`.
 */
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Run, RunId, TrailPoint } from '../types/domain.js';

/** Start a run, closing any that was left open — one at a time. */
export async function beginRun(store: KeyValueStore, id: RunId, now: number): Promise<RunId> {
  const open = await activeRunOf(store);
  if (open) await closeRun(store, open.id);

  const run: Run = { id, startedAt: now, status: 'active', pointCount: 0, distanceM: 0 };
  await store.set(K.run(id), run);
  await store.set(K.activeRun, id);
  await store.set(K.trail(id), [] as TrailPoint[]);
  return id;
}

export async function activeRunOf(store: KeyValueStore): Promise<Run | null> {
  const id = await store.get<RunId>(K.activeRun);
  if (!id) return null;
  const run = await store.get<Run>(K.run(id));
  return run && run.status === 'active' ? run : null;
}

export async function closeRun(store: KeyValueStore, runId: RunId): Promise<void> {
  const run = await store.get<Run>(K.run(runId));
  if (run) await store.set(K.run(runId), { ...run, status: 'closed' });
  if ((await store.get<RunId>(K.activeRun)) === runId) await store.delete(K.activeRun);
}

export async function trailPointsOf(store: KeyValueStore, runId: RunId): Promise<TrailPoint[]> {
  return (await store.get<TrailPoint[]>(K.trail(runId))) ?? [];
}
