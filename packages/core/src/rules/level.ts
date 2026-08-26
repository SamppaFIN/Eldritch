/**
 * Consciousness level from XP.
 *
 * v2's table stopped at 20 but its code kept counting, and a stale save produced a
 * level-118 player whose encounters then silently stopped firing. The cap here is not
 * a nicety — it is the fix, and `levelForXp` is the only place a level may be derived.
 *
 * The v2 table is sparse (1, 5, 10, 15, 20) so the levels between milestones are
 * interpolated linearly. That reproduces every stated milestone exactly and gives the
 * player a step roughly every 125 XP early on, widening as they climb.
 */
import { LEVELS, MAX_LEVEL } from './constants.js';

export interface LevelState {
  level: number;
  name: string;
  /** XP at which the current level began. */
  levelXp: number;
  /** XP at which the next level begins, or null at the cap. */
  nextXp: number | null;
  /** 0-1 progress through the current level. 1 at the cap. */
  progress: number;
}

/** Level for an XP total. Never exceeds MAX_LEVEL, never below 1. */
export function levelForXp(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;

  const last = LEVELS[LEVELS.length - 1] as (typeof LEVELS)[number];
  if (xp >= last.xp) return MAX_LEVEL;

  for (let i = 0; i < LEVELS.length - 1; i++) {
    const lo = LEVELS[i] as (typeof LEVELS)[number];
    const hi = LEVELS[i + 1] as (typeof LEVELS)[number];
    if (xp < hi.xp) {
      const span = hi.xp - lo.xp;
      const steps = hi.level - lo.level;
      const level = lo.level + Math.floor(((xp - lo.xp) / span) * steps);
      return Math.min(level, MAX_LEVEL);
    }
  }

  return MAX_LEVEL;
}

/** The milestone name in force at a level. */
export function levelName(level: number): string {
  let name = (LEVELS[0] as (typeof LEVELS)[number]).name;
  for (const milestone of LEVELS) {
    if (level >= milestone.level) name = milestone.name;
  }
  return name;
}

/** XP needed to reach a level. Inverse of levelForXp, to the level boundary. */
export function xpForLevel(level: number): number {
  const capped = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL);
  if (capped <= 1) return 0;

  const last = LEVELS[LEVELS.length - 1] as (typeof LEVELS)[number];
  if (capped >= last.level) return last.xp;

  for (let i = 0; i < LEVELS.length - 1; i++) {
    const lo = LEVELS[i] as (typeof LEVELS)[number];
    const hi = LEVELS[i + 1] as (typeof LEVELS)[number];
    if (capped <= hi.level) {
      const span = hi.xp - lo.xp;
      const steps = hi.level - lo.level;
      return lo.xp + Math.ceil(((capped - lo.level) / steps) * span);
    }
  }

  return last.xp;
}

/** Everything the HUD needs, derived once. */
export function levelState(xp: number): LevelState {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  const level = levelForXp(safeXp);
  const levelXp = xpForLevel(level);

  if (level >= MAX_LEVEL) {
    return { level, name: levelName(level), levelXp, nextXp: null, progress: 1 };
  }

  const nextXp = xpForLevel(level + 1);
  const span = nextXp - levelXp;
  return {
    level,
    name: levelName(level),
    levelXp,
    nextXp,
    progress: span > 0 ? Math.min(1, (safeXp - levelXp) / span) : 1,
  };
}
