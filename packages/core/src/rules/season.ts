/**
 * The season as a thing the game knows it is in (BRDC-SEASON-002).
 *
 * Eldritch-season.pdf: a season opens, the Doom rises, the Reckoning comes, the season is
 * sealed, the map lies as a fossil, and the next one opens. Infinite 2026-09-29: the length
 * is not fixed — *"season kestää kunnes saadaan uusi versio tulille"* — so the Reckoning
 * comes from the Doom, from an optional deadline day, or by hand (`forcePhase`), never
 * from a hard-coded calendar.
 *
 * Pure: the Worker holds the one shared `Season` and calls `advanceSeason` on it.
 */

export type SeasonPhase =
  | 'open' //          day 1 → Doom 13 (or the deadline day, if one is set)
  | 'reckoning' //     72 h, the Ancient One's strength shared by everyone
  | 'sealed' //        map frozen, tally final — walkable as a fossil for 48 h
  | 'interregnum' //   48 h: boards, heirloom, joining the next season
  | 'next';

export type SeasonOutcome = 'quiet' | 'risen';

export interface Season {
  n: number;
  name: string;
  /** Reseeds deposits, wonders and gate sites; the shoreline (OSM terrain) stays. */
  seed: string;
  phase: SeasonPhase;
  opensAt: number;
  /** When set, the Reckoning starts on this day at the latest (the PDF's day 39). */
  reckoningByDay?: number;
  reckoningAt?: number;
  sealedAt?: number;
  interregnumAt?: number;
  doom: number;
  bossHp: number;
  bossMaxHp: number;
  outcome?: SeasonOutcome;
}

export const DOOM_MAX = 13;
export const RECKONING_MS = 72 * 3_600_000;
export const FOSSIL_MS = 48 * 3_600_000;
export const INTERREGNUM_MS = 48 * 3_600_000;
/** The Ancient One's strength scales with the server: 900 per active realm. */
export const BOSS_HP_PER_REALM = 900;
/** A quiet lake multiplies every realm's Legacy. */
export const QUIET_LEGACY_MULT = 1.2;

const DAY_MS = 86_400_000;

/** Day of the season, 1 on the day it opens. */
export function seasonDay(season: Season, now: number): number {
  return Math.max(1, Math.floor((now - season.opensAt) / DAY_MS) + 1);
}

export function bossMaxHp(activeRealms: number): number {
  return BOSS_HP_PER_REALM * Math.max(1, activeRealms);
}

export function openSeason(n: number, name: string, seed: string, opensAt: number, reckoningByDay?: number): Season {
  return {
    n,
    name,
    seed,
    phase: 'open',
    opensAt,
    ...(reckoningByDay !== undefined ? { reckoningByDay } : {}),
    doom: 0,
    bossHp: 0,
    bossMaxHp: 0,
  };
}

function toReckoning(season: Season, now: number, activeRealms: number): Season {
  const hp = bossMaxHp(activeRealms);
  return { ...season, phase: 'reckoning', reckoningAt: now, bossHp: hp, bossMaxHp: hp };
}

function toSealed(season: Season, now: number, outcome: SeasonOutcome): Season {
  return { ...season, phase: 'sealed', sealedAt: now, outcome };
}

/**
 * Move the season on as far as `now` allows. Idempotent: calling it twice with the same
 * `now` changes nothing the second time. Each step is taken at most once per call so a
 * Worker that was asleep for days still passes through every phase in order.
 */
export function advanceSeason(season: Season, now: number, activeRealms: number): Season {
  switch (season.phase) {
    case 'open': {
      const deadline = season.reckoningByDay !== undefined && seasonDay(season, now) >= season.reckoningByDay;
      return season.doom >= DOOM_MAX || deadline ? toReckoning(season, now, activeRealms) : season;
    }
    case 'reckoning':
      if (season.bossHp <= 0) return toSealed(season, now, 'quiet');
      if (now - (season.reckoningAt ?? now) >= RECKONING_MS) return toSealed(season, now, 'risen');
      return season;
    case 'sealed':
      return now - (season.sealedAt ?? now) >= FOSSIL_MS ? { ...season, phase: 'interregnum', interregnumAt: now } : season;
    case 'interregnum':
      return now - (season.interregnumAt ?? now) >= INTERREGNUM_MS ? { ...season, phase: 'next' } : season;
    case 'next':
      return season;
  }
}

/** The admin switch: the season's length is Infinite's call, not the calendar's. */
export function forcePhase(season: Season, phase: SeasonPhase, now: number, activeRealms: number): Season {
  if (phase === season.phase) return season;
  if (phase === 'reckoning') return toReckoning(season, now, activeRealms);
  if (phase === 'sealed') return toSealed(season, now, season.bossHp <= 0 && season.phase === 'reckoning' ? 'quiet' : 'risen');
  if (phase === 'interregnum') return { ...season, phase, interregnumAt: now };
  return { ...season, phase };
}

/** Damage to the shared Ancient One; never below 0. */
export function damageBoss(season: Season, amount: number): Season {
  if (season.phase !== 'reckoning' || amount <= 0) return season;
  return { ...season, bossHp: Math.max(0, season.bossHp - amount) };
}

/** Only an open season can be claimed on; sealed and later are read-only. */
export const seasonIsPlayable = (season: Season): boolean => season.phase === 'open' || season.phase === 'reckoning';

export const legacyMultiplier = (outcome: SeasonOutcome | undefined): number =>
  outcome === 'quiet' ? QUIET_LEGACY_MULT : 1;
