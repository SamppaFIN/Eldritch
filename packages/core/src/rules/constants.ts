/**
 * Every game constant. Single source — nothing here may be duplicated in a component.
 *
 * Values marked "v2" were measured out of the old codebase (see ANALYSIS.md §6) and
 * are kept because they were already tuned by play. Values without a marker are new
 * to v3's territory mechanic and come from files/MASTERPLAN.md §2.
 */

/* --- H3 ------------------------------------------------------------------ */

/** Ownership resolution. ~2150 m² per cell. Matches supabase/migrations/0001_init.sql. */
export const H3_RES_OWNERSHIP = 11;
/** Realtime channel shard (Phase 3). ~36 km². */
export const H3_RES_REGION = 6;
/**
 * Nominal res-11 cell area, for rough estimates only.
 *
 * H3 cells are not equal-area: 2150 m² is the global mean, but at Tampere's latitude
 * (61°N) a res-11 cell measures ~1622 m² — a 25% difference. Any figure shown to a
 * player must come from `h3.cellArea(cell, 'm2')` on the cells they actually own.
 */
export const CELL_AREA_M2_NOMINAL = 2150;

/* --- GPS validation (anti-cheat; never weaken without being asked) -------- */

export const MAX_ACCURACY_M = 50;
/** ~29 km/h. Faster than a person can run, slower than a bus. */
export const MAX_SPEED_MS = 8;
/**
 * No fixes for this long means the game stopped watching, not that the player teleported.
 *
 * A browser freezes a backgrounded tab, so a phone in a pocket produces exactly this:
 * silence, then a fix from somewhere else entirely. Treating that as a jump strands the
 * player — every step after it fails the adjacency test and the walk claims nothing at
 * all. Treating it as a resume lets them start growing again from where they really are,
 * which is no more than walking there would have given them anyway.
 */
export const OBSERVATION_GAP_MS = 2 * 60_000;

export const MIN_POINT_INTERVAL_MS = 5_000;
/** v2 PathMarkerService: points closer than this merged instead of adding a row. */
export const CONSOLIDATE_RADIUS_M = 5;

/* --- Loop detection ------------------------------------------------------ */

export const LOOP_CLOSE_RADIUS_M = 25;
export const MIN_LOOP_POINTS = 8;

/**
 * A ring must enclose at least this much to count. About 70 m square.
 *
 * Expressed in the game's own terms: roughly three H3 cells at res 11. A ring smaller
 * than that would be granted one cell or none, so closing it is not worth interrupting
 * a walk for.
 *
 * It is also the guard against phantom loops. On a bad sky the recorded trail crosses
 * itself constantly, and `gps-noise.json` closed a 1278 m² squiggle at point 32 —
 * before the walker had finished the block they were actually circling.
 *
 * Perimeter is not the discriminator here, tempting as it looks: noise inflates it far
 * more than it inflates area. The same 120 m block measures 480 m of perimeter clean
 * and 1489 m through 12 m of scatter, so every perimeter-based test — including the
 * isoperimetric ratio — rates the real loop worse than the phantom.
 */
export const MIN_LOOP_AREA_M2 = 5_000;
/** Scaled by (1 + level/10) at call time. */
export const MAX_LOOP_AREA_M2 = 50_000;
export const MAX_LOOP_DURATION_MS = 90 * 60_000;

/* --- Capture and siege --------------------------------------------------- */

export const BASE_STRENGTH = 100;
export const MAX_STRENGTH = 500;
/** First pass through a cell on a new UTC calendar day. */
export const DAY_VISIT_BONUS = 25;
/** ...and you were also there yesterday. Routine beats grinding. */
export const STREAK_VISIT_BONUS = 50;
export const NEIGHBOUR_BONUS = 15;
export const NEIGHBOUR_BONUS_CAP = 90;
export const ANCHOR_BONUS = 200; // Phase 6
export const LEVEL_STRENGTH_BONUS = 5;

/* --- XP -------------------------------------------------------------------
   New to v3. v2's XP came from discoveries; here the primary source is ground.
   Taking a cell from someone is worth more than finding empty land, because it
   cost more walks. Tunable — nothing else depends on the exact numbers. */

export const XP_PER_CELL_CLAIMED = 10;
export const XP_PER_CELL_TAKEN = 25;
export const XP_PER_CELL_REINFORCED = 2;

/* --- Decay --------------------------------------------------------------- */

export const DECAY_GRACE_HOURS = 48;
export const DECAY_PER_DAY = 10;
export const DECAY_PER_DAY_LATE = 25;
export const DECAY_LATE_AFTER_DAYS = 14;

/* --- Consciousness levels (v2 GameConfig.consciousness) -------------------
   v2's table stopped at 20 but its code let a player reach 118 and corrupted
   the save. The cap is the fix, and it is not optional. */

export const LEVELS = [
  { level: 1, name: 'Dormant', xp: 0 },
  { level: 5, name: 'Awakening', xp: 500 },
  { level: 10, name: 'Aware', xp: 1_500 },
  { level: 15, name: 'Enlightened', xp: 3_000 },
  { level: 20, name: 'Transcendent', xp: 5_000 },
] as const;

export const MAX_LEVEL = 20;
export const XP_PER_LEVEL = 100; // v2

/* --- Trail submission ---------------------------------------------------- */

/** Batch window. One write per GPS tick kills the battery. */
export const TRAIL_BATCH_MS = 10_000;
/** v2 GameConfig.backgroundGPS: minimum movement to count. */
export const MIN_DISTANCE_FOR_COUNT_M = 10;

/* --- Discoveries (v2 GameConfig.discovery) — Phase 6, parked here so the
       numbers are not lost. Not used before Phase 6. ---------------------- */

export const DISCOVERY = {
  spawnRadiusM: 150,
  collectRadiusM: 5,
  maxActive: 10,
  respawnCooldownMs: 300_000,
  rarities: {
    common: { chance: 0.6, xp: 50, glyph: '🌸' },
    uncommon: { chance: 0.25, xp: 100, glyph: '🌟' },
    rare: { chance: 0.12, xp: 150, glyph: '🔮' },
    epic: { chance: 0.03, xp: 200, glyph: '💫' },
  },
  types: ['cosmic-fragment', 'sacred-geometry', 'ancient-sigil', 'void-essence'],
} as const;

/* --- Anchor Stone (v2 TerritorySystem) — Phase 6 ------------------------- */

export const ANCHOR = {
  expansionRangeM: 50,
  minExpansionDistanceM: 5,
  maxExpansionPerMarkerM: 50,
  borderPointCount: 12,
  initialRadiusM: 20,
  cooldownMs: 900_000,
  maxCarrySteps: 100,
  stepMarkerInterval: 50,
} as const;

/**
 * The wire format for a challenge carried by hand (BRDC-WAGER-JSON-001).
 *
 * Separate from SAVE_VERSION on purpose: a save and a message between two phones change
 * for different reasons, and bumping one should not invalidate the other.
 *
 * v2 added the sender's defence. Both phones have to compute the same fight from the
 * same inputs, so a v1 message is genuinely unusable rather than merely older — and the
 * refusal already says so in words.
 */
export const CHALLENGE_VERSION = 2;

/**
 * The wire format for one region's slice of the shared world (BRDC-SHARE-001).
 *
 * Its own number, like CHALLENGE_VERSION: `world/<res6>.json` is rebuilt by a cron job
 * from player submissions and read by every client, and it changes shape for reasons that
 * have nothing to do with a save or a hand-carried challenge. An unknown version is
 * rejected by name, never merged.
 */
export const WORLD_VERSION = 1;
/** Cells per region shard. A city block is fine; a city is a directory of shards. */
export const MAX_SHARD_CELLS = 4_000;

/**
 * Ownership changes kept per cell (BRDC-HEX-001).
 *
 * A cell on a contested border can change hands many times; without a ceiling its history
 * grows storage without bound. Twenty is enough to read "this has been fought over"
 * without keeping a ledger back to the first claim.
 */
export const MAX_CELL_HISTORY = 20;

/* --- The Wager (BRDC-WAGER-BATTLE-001) ---------------------------------- */

/**
 * Rounds before a fight is called on points.
 *
 * Long enough that a small advantage compounds, short enough that a duel is a moment
 * rather than a spectator sport — the result is read on a phone, standing up.
 */
export const WAGER_ROUNDS = 12;

/** Orcs bite harder. This is what they add to a blow. */
export const ORC_BITE = 60;

/** A wall turns aside this percentage of every blow, and never tires. */
export const WALL_GUARD = 35;

/**
 * Strength a lost Wager costs the loser's cells on the winner's map.
 *
 * Roughly one and a half ordinary attacks — enough that winning saves a walk or two,
 * not enough that a duel replaces walking. It never reaches zero: a cell emptied this
 * way would be released by decay, and that is ownership changing hands by message.
 */
export const WAGER_SPOIL = 150;

/* --- The Keep (BRDC-CASTLE-001) ------------------------------------------- */

/**
 * How far the public decoy sits from the real Hearth.
 *
 * Far enough that it does not read as the same building; close enough that it still
 * looks like this player's corner of town on a map that only ever shows the Keep.
 */
export const CASTLE_MIN_RADIUS_M = 300;
export const CASTLE_MAX_RADIUS_M = 900;
