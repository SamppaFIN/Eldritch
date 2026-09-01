/**
 * Every key the store holds, in one place.
 *
 * Lifted out of MockRepository once the pouch and the Hearth became their own modules:
 * two files inventing key strings for the same records is how a save quietly grows a
 * second, divergent copy of itself.
 */
import { regionOf } from '../geo/cells.js';
import type { RunId } from '../types/index.js';

export const K = {
  profile: 'profile',
  activeRun: 'run:active',
  seeded: 'seeded',
  run: (id: RunId) => `run:${id}`,
  trail: (id: RunId) => `trail:${id}`,
  // The res-6 region goes in the key so a viewport read can range-scan one region's
  // cells instead of every cell in the store (BRDC-SCALE-001). Callers still pass only
  // the h3; the region is derived here, in one place.
  cell: (h3: string) => `cell:${regionOf(h3)}:${h3}`,
  dwell: 'dwell',
  home: 'home',
  castle: 'castle',
  defence: 'defence',
  fought: 'wager:fought',
  lastReading: 'reading:last',
  researched: 'researched',
  /** Temple expansion levels, `Record<H3Index, number>` (BRDC-MANA-001). */
  expansions: 'expansions',
  /** Every stretch ever walked, `Record<edge, PathSegment>` (BRDC-TRAIL-003). */
  paths: 'paths',
  /** Running spells, `ActiveSpell[]`, pruned on cast (BRDC-SPELL-001). */
  spells: 'spells',
  /** Trade Routes, `TradeRoute[]` — two-cell links (BRDC-BUILD-004). */
  tradeRoutes: 'trade-routes',
  /** The action log, a capped `LogEntry[]` (BRDC-LOG-001). */
  log: 'log',
  /** Adventure state, `Record<id, { stage, done? }>` (BRDC-QUEST-001). */
  adventures: 'adventures',
  /** Codex slugs an adventure has unlocked (BRDC-QUEST-001). */
  unlocked: 'unlocked',
} as const;
