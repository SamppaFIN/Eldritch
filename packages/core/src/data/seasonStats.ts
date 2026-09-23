/**
 * A season's daily trail: distance walked and hexes held, snapshotted once a day
 * (BRDC-SEASON-001).
 *
 * The same two numbers Route mode's own leaderboard already promises — "kuljettu matka
 * ja vallatut heksat" — read here from *every* live source regardless of mode, since a
 * shared weekly challenge among six known players is not the place to split them by
 * which mode they happened to pick. Adventure mode has no lifetime distance counter of
 * its own (`BRDC-MODE-002` built one only for Route mode); `leyM`, the unique-path
 * measure the Codex already uses, stands in for it there.
 *
 * Pure and clock-free, like `worldStats.ts` beside it — the Worker snapshots this once a
 * day from the same live sources `rebuild` already computed.
 */
import type { PlayerId } from '../types/domain.js';
import type { WorldSource } from './world.js';

export interface SeasonStanding {
  id: PlayerId;
  name: string;
  distanceM: number;
  hexes: number;
}

export function seasonStandingsOf(sources: readonly WorldSource[]): SeasonStanding[] {
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    distanceM: Math.round(s.routeDistanceM ?? s.leyM ?? 0),
    hexes: s.cells.length,
  }));
}

/**
 * One player's personal starting line for the week's challenge — their own figures at
 * the moment they chose to join, not a fixed calendar date. "Join the Weekly Tournament"
 * publishes one of these; the daily snapshot above is read against it to say what a
 * joined player has gained since *they* opted in, not since the season's own oldest
 * recorded day (Infinite, 2026-09-23: *"valitset liity viikkoturnaukseen ja sen jälkeen
 * saat sen hetken tilanteen listoille"*).
 */
export interface SeasonJoin extends SeasonStanding {
  joinedAt: number;
}

/** A join read back with the player's *current* published figures beside it. */
export interface SeasonJoinView extends SeasonJoin {
  current?: { distanceM: number; hexes: number };
}

/**
 * Each join laid against whoever is live right now (Infinite, 2026-09-23: names and
 * standings should follow the player's latest publish, not freeze at the moment they
 * joined). The name is the live one when there is one — a rename reaches the list on the
 * next publish — and `current` is absent for a player whose file has expired, so the
 * caller reads that as "no progress yet" rather than inventing a zero.
 */
export function joinsWithCurrent(
  joins: readonly SeasonJoin[],
  live: readonly SeasonStanding[],
): SeasonJoinView[] {
  const byId = new Map(live.map((s) => [s.id, s]));
  return joins.map((j) => {
    const now = byId.get(j.id);
    return now
      ? { ...j, name: now.name, current: { distanceM: now.distanceM, hexes: now.hexes } }
      : { ...j };
  });
}

/**
 * Days since the Unix epoch, so the Worker can keep one snapshot per day without a cron
 * trigger — it only ever writes on `/submit`. Same shape as `atlasWeekKey`, daily instead
 * of weekly, and the same reason: the only property this needs is "changes once every
 * 24 hours", not calendar correctness.
 */
export function seasonDayKey(now: number): string {
  return `day-${Math.floor(now / 86_400_000)}`;
}
