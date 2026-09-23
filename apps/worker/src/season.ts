/**
 * One season snapshot a day, so six friends can watch a week's trail take shape
 * (BRDC-SEASON-001). Same shape as `history.ts`'s weekly Atlas snapshots, daily instead
 * — no cron trigger, written opportunistically on `/submit`, guarded by `seasonDayKey` so
 * it only actually writes once every 24 hours no matter how often anyone publishes.
 */
import { seasonDayKey, seasonStandingsOf } from '@es3/core/data';
import type { SeasonJoin, SeasonStanding, WorldSource } from '@es3/core/data';
import type { KV } from './index.js';

const SNAPSHOT_PREFIX = 'season:day:';
/** ~2 months of daily snapshots — a season is a week; this is room for several. */
const MAX_DAYS = 60;
const JOIN_PREFIX = 'season:join:';
const MAX_TEXT = 60;

export interface SeasonSnapshot {
  dayKey: string;
  generatedAt: number;
  standings: SeasonStanding[];
}

const snapshotKey = (dayKey: string) => SNAPSHOT_PREFIX + dayKey;

/** Every stored snapshot's day key, oldest first — sorted numerically, not as text:
 *  `seasonDayKey` does not zero-pad, so "day-100" would otherwise sort before "day-99". */
export async function listSeasonDays(kv: KV): Promise<string[]> {
  const { keys } = await kv.list({ prefix: SNAPSHOT_PREFIX });
  return keys
    .map((k) => k.name.slice(SNAPSHOT_PREFIX.length))
    .sort((a, b) => Number(a.slice('day-'.length)) - Number(b.slice('day-'.length)));
}

export async function readSeasonDay(kv: KV, dayKey: string): Promise<SeasonSnapshot | null> {
  const raw = await kv.get(snapshotKey(dayKey));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SeasonSnapshot;
  } catch {
    return null;
  }
}

export async function maybeSnapshotSeason(kv: KV, now: number, live: readonly WorldSource[]): Promise<void> {
  const dayKey = seasonDayKey(now);
  if (await kv.get(snapshotKey(dayKey))) return;

  const snapshot: SeasonSnapshot = { dayKey, generatedAt: now, standings: seasonStandingsOf(live) };
  await kv.put(snapshotKey(dayKey), JSON.stringify(snapshot));

  const days = await listSeasonDays(kv);
  const excess = days.length - MAX_DAYS;
  if (excess > 0) for (const stale of days.slice(0, excess)) await kv.delete(snapshotKey(stale));
}

function isSeasonJoin(v: unknown): v is SeasonJoin {
  const j = v as Partial<SeasonJoin> | null;
  return (
    !!j &&
    typeof j.id === 'string' &&
    typeof j.name === 'string' &&
    typeof j.distanceM === 'number' &&
    typeof j.hexes === 'number'
  );
}

/**
 * One player's own starting line, published by "Join the Weekly Tournament"
 * (BRDC-SEASON-001). One row per player, overwritten on a re-join — choosing to join
 * again resets that player's own gained-since-then figure, which is the point of
 * letting them press it more than once.
 */
export async function publishSeasonJoin(kv: KV, raw: unknown, now: number): Promise<SeasonJoin | null> {
  if (!isSeasonJoin(raw)) return null;
  const join: SeasonJoin = {
    id: raw.id,
    name: raw.name.slice(0, MAX_TEXT),
    distanceM: Math.round(raw.distanceM),
    hexes: raw.hexes,
    joinedAt: now,
  };
  await kv.put(JOIN_PREFIX + join.id, JSON.stringify(join));
  return join;
}

export async function listSeasonJoins(kv: KV): Promise<SeasonJoin[]> {
  const { keys } = await kv.list({ prefix: JOIN_PREFIX });
  const out: SeasonJoin[] = [];
  for (const key of keys) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    try {
      const join = JSON.parse(raw) as unknown;
      if (isSeasonJoin(join)) out.push(join);
    } catch {
      /* a row that will not parse is one player missing, not a broken tournament */
    }
  }
  return out;
}
