/**
 * One Atlas snapshot a week, so a municipality's ownership can be compared then-and-now
 * (BRDC-ATLAS-001's "laajeneminen ajassa" — the RED's own example is "sama kaupunki
 * viikko sitten ja nyt").
 *
 * No cron trigger: this Worker only ever runs on `/submit`, so a snapshot is taken then,
 * guarded by `atlasWeekKey` so it only actually writes once every seven days no matter
 * how often players publish. Retention is a fixed count, pruned on the same write —
 * unbounded KV growth from a feature nobody asked to keep forever is its own kind of bug.
 */
import { atlasOf, atlasWeekKey } from '@es3/core/data';
import type { AtlasRegion, WorldSource } from '@es3/core/data';
import type { KV } from './index.js';

const SNAPSHOT_PREFIX = 'atlas:snapshot:';
/** ~3 months of weekly snapshots — enough to answer "a while ago" without keeping every
 *  week since the Worker was born. */
const MAX_SNAPSHOTS = 12;

export interface AtlasSnapshot {
  weekKey: string;
  generatedAt: number;
  regions: AtlasRegion[];
}

const snapshotKey = (weekKey: string) => SNAPSHOT_PREFIX + weekKey;

/** Every stored snapshot's week key, oldest first — what a "compare to" picker offers. */
export async function listSnapshotWeeks(kv: KV): Promise<string[]> {
  const { keys } = await kv.list({ prefix: SNAPSHOT_PREFIX });
  return keys.map((k) => k.name.slice(SNAPSHOT_PREFIX.length)).sort();
}

export async function readSnapshot(kv: KV, weekKey: string): Promise<AtlasSnapshot | null> {
  const raw = await kv.get(snapshotKey(weekKey));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AtlasSnapshot;
  } catch {
    return null;
  }
}

/**
 * Writes this week's snapshot if one is not already there, from the live sources
 * `rebuild` already computed — one extra KV read/write on a write path that is already
 * rare (a player publishing, at most once a minute per player).
 */
export async function maybeSnapshot(kv: KV, now: number, live: readonly WorldSource[]): Promise<void> {
  const weekKey = atlasWeekKey(now);
  if (await kv.get(snapshotKey(weekKey))) return;

  const snapshot: AtlasSnapshot = { weekKey, generatedAt: now, regions: atlasOf(live) };
  await kv.put(snapshotKey(weekKey), JSON.stringify(snapshot));

  const weeks = await listSnapshotWeeks(kv);
  const excess = weeks.length - MAX_SNAPSHOTS;
  if (excess > 0) for (const stale of weeks.slice(0, excess)) await kv.delete(snapshotKey(stale));
}
