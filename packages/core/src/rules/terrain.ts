/**
 * What the ground under a cell is made of.
 *
 * Owning territory has meant a number going up. This is what makes one cell worth more
 * than another: a lake gives food, woodland gives timber, a parade of shops gives gold.
 * You cannot choose where those are — they are where you live — so the map decides what
 * a walk is worth, which is the whole point of a game played outdoors.
 *
 * Terrain has two sources now (BRDC-TERRAIN-002). Where the vector tiles already on the
 * device say something — a lake, a park, a row of shops — that is used and marked
 * `source: 'tiles'`. Where they say nothing, a deterministic hash of the H3 index stands
 * in, clustered so it forms woods and hills rather than per-cell noise, marked
 * `source: 'hash'`. The hash is not real terrain; it is the shape real terrain fills.
 * `terrainOf(h3) → Terrain` is the interface BRDC-TERRAIN-001 locked; only the body and
 * the `Terrain` shape have changed.
 */
import { cellToParent } from 'h3-js';
import { DECAY_GRACE_HOURS } from './constants.js';
import { seededTerrainOf } from './terrainSeed.js';
import type { Cell, H3Index, Terrain, TerrainKind } from '../types/domain.js';

export type { Terrain, TerrainKind, TerrainSource } from '../types/domain.js';

/**
 * What can be built on a terrain. The slugs are consumed by BRDC-BUILD-001; they live
 * here because "which terrain allows which building" is a property of the ground.
 */
export type BuildSite =
  | 'sawmill'
  | 'quarry'
  | 'mine'
  | 'fishery'
  | 'harbour'
  | 'market'
  | 'shrine';

/**
 * Every resource the game knows about, in one place.
 *
 * Nine, not the ten Infinite's 2026-08-31 plan claims in its own heading — counted
 * from that plan's own building tables (wood, stone, iron, food, gold, wisdom, mana,
 * culture, tokens). The mismatch is the plan's, not a field missing here.
 *
 * `ResourcePool` and every function below are derived from this array rather than
 * hand-listing fields, so a tenth resource, if one turns out to be real, is one line
 * here instead of ten scattered edits (BRDC-ECON-001's own RED).
 */
export const RESOURCE_KINDS = [
  'wood',
  'stone',
  'iron',
  'food',
  'gold',
  'wisdom',
  'mana',
  'culture',
  'tokens',
] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export type ResourcePool = Record<ResourceKind, number>;

export const EMPTY_POOL: ResourcePool = Object.fromEntries(
  RESOURCE_KINDS.map((k) => [k, 0]),
) as ResourcePool;

/**
 * What each terrain gives, and what can be built on it. One table (BRDC-TERRAIN-002).
 *
 * Water gives `food`, not a `water` resource — the plan's own model (a fishing pier on a
 * lake gives fish) — so the pool never carries a resource nobody can spend. `wisdom`,
 * `mana`, `culture` and `tokens` still have no terrain feeding them; that is honest and
 * deliberate (a field nothing earns yet is not a field that does not exist), and the
 * buildings that produce them are `BRDC-BUILD-001`'s problem.
 */
export const TERRAIN_TABLE: Readonly<
  Record<TerrainKind, { resource: ResourceKind | null; buildSites: readonly BuildSite[] }>
> = {
  plain: { resource: null, buildSites: ['shrine'] },
  forest: { resource: 'wood', buildSites: ['sawmill'] },
  hill: { resource: 'stone', buildSites: ['quarry'] },
  mountain: { resource: 'iron', buildSites: ['mine'] },
  lake: { resource: 'food', buildSites: ['fishery'] },
  coast: { resource: 'food', buildSites: ['fishery', 'harbour'] },
  market: { resource: 'gold', buildSites: ['market'] },
};

/** Paid once, the moment a producing cell changes hands. Never capped — see spend below. */
export const CLAIM_YIELD = 10;
/** Paid for holding a producing cell, per hour, while it is awake. */
export const TRICKLE_PER_HOUR = 2;

/**
 * How much of any one resource the pouch can hold before production stops.
 *
 * Flat for every resource, not per-building: nothing raises it yet. The plan's own
 * Storage building will, in `BRDC-BUILD-001` — at which point this becomes a value fed
 * by how many a player has built, not a constant. Sized so a handful of producing
 * cells fill it in roughly a week, matching the tempo this ticket locks in: a weekend
 * away costs nothing, a week away stops the economy, and walking restarts it.
 */
export const BASE_STORAGE_CAP = 500;

/** Milliseconds of no visit before a cell stops producing. Same clock as decay. */
export const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

/**
 * The resolution terrain clusters at.
 *
 * Res 9 holds forty-nine ownership cells — about a tenth of a square kilometre, which is
 * a park or a small lake. Clustering at the ownership resolution itself would give a
 * dither of unrelated cells; clustering any coarser would make a whole neighbourhood one
 * material.
 */
const CLUSTER_RES = 9;

/** FNV-1a over the index. Cheap, stable, and spread evenly enough to threshold on. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Region roll → kind. Plain keeps the largest share; the rest is split across the six. */
function kindForRegion(region: number): TerrainKind {
  if (region < 0.09) return 'lake';
  if (region < 0.16) return 'coast';
  if (region < 0.27) return 'forest';
  if (region < 0.34) return 'hill';
  if (region < 0.41) return 'mountain';
  if (region < 0.48) return 'market';
  return 'plain';
}

/**
 * The terrain of one cell, from the hash. `source` is always `'hash'` here — a tile
 * reading is resolved once and stored on the cell (`Cell.terrain`, `terrainForCell`).
 *
 * Two rolls, not one. The first picks what the surrounding region is made of; the second
 * asks whether this particular cell is really that, which frays the edges. A region of
 * uniform hexagons reads as generated, because it is.
 */
export function terrainOf(h3: H3Index): Terrain {
  // A hand-surveyed test area wins over the hash (BRDC-TERRAIN-003); null everywhere else.
  const seeded = seededTerrainOf(h3);
  if (seeded) return seeded;

  const kind = kindForRegion(hash(`terrain:${cellToParent(h3, CLUSTER_RES)}`));
  if (kind === 'plain') return { kind: 'plain', source: 'hash' };
  return { kind: hash(`edge:${h3}`) < 0.72 ? kind : 'plain', source: 'hash' };
}

/**
 * The terrain to use for a cell: the survey if it covers this cell, then whatever a
 * tile read stored, then the hash. The survey beats a stored tile value on purpose —
 * it is the thing that was checked by hand.
 */
export function terrainForCell(cell: Cell): Terrain {
  return seededTerrainOf(cell.h3) ?? cell.terrain ?? terrainOf(cell.h3);
}

export function resourceOf(h3: H3Index): ResourceKind | null {
  return TERRAIN_TABLE[terrainOf(h3).kind].resource;
}

/** The resource for a cell, preferring its stored terrain over the hash. */
export function resourceForCell(cell: Cell): ResourceKind | null {
  return TERRAIN_TABLE[terrainForCell(cell).kind].resource;
}

/**
 * Add the one-off yield for taking a cell. Returns a new pool; never mutates.
 *
 * Keyed on the h3 alone, so it reads the hash: at the moment ground changes hands its
 * tile terrain may not be resolved yet. The trickle, which is handed whole cells, uses
 * the resolved value once one exists (`resourceForCell`).
 */
export function addClaimYield(pool: ResourcePool, h3: H3Index): ResourcePool {
  const resource = resourceOf(h3);
  if (!resource) return pool;
  return { ...pool, [resource]: pool[resource] + CLAIM_YIELD };
}

/**
 * What a set of cells produce over `ms`, counting only the ones awake at `now`.
 *
 * A cell not visited within `DECAY_GRACE_HOURS` earns nothing — the same clock as
 * decay, deliberately, so this needed no ticket-specific timer of its own. Dormancy is
 * checked once against `now`, not resolved minute by minute across the span: a cell
 * that went dormant partway through `ms` is treated as dormant for the whole of it.
 * Settling runs often enough in practice (every trail batch) that this never costs
 * more than a few minutes of trickle either way.
 *
 * Whole units only. Fractions would accumulate rounding differences between the client
 * and the SQL that has to agree with it in Phase 5, and there is nothing to gain from
 * half a log.
 */
export function trickle(cells: readonly Cell[], ms: number, now: number): ResourcePool {
  const hours = Math.max(0, ms) / 3_600_000;
  const pool = { ...EMPTY_POOL };
  for (const cell of cells) {
    if (now - cell.lastVisitedAt > DORMANT_AFTER_MS) continue;
    const resource = resourceForCell(cell);
    if (resource) pool[resource] += TRICKLE_PER_HOUR * hours * localShare(cell);
  }

  const floored = { ...EMPTY_POOL };
  for (const k of RESOURCE_KINDS) floored[k] = Math.floor(pool[k]);
  return floored;
}

/**
 * The fraction of a cell's trickle the local player keeps.
 *
 * `1` for ground held outright. A cell an imported challenge also claimed
 * (`cell.shared`, BRDC-WAGER-JSON-002, -006) is split by each side's strength at the
 * moment of import; when those are equal, by the days each side has walked it
 * (`myDays` / `theirDays`), and when neither separates them, evenly. Reinforcing the cell
 * on a new day drops `shared` and takes the whole yield back.
 */
export function localShare(cell: Cell): number {
  const s = cell.shared;
  if (!s) return 1;
  const total = s.mineAtImport + s.theirsAtImport;
  if (total > 0 && s.mineAtImport !== s.theirsAtImport) return s.mineAtImport / total;
  const dTotal = (s.myDays ?? 0) + (s.theirDays ?? 0);
  return dTotal > 0 ? (s.myDays ?? 0) / dTotal : 0.5;
}

export interface ResourceState {
  pool: ResourcePool;
  /** When the hourly trickle was last settled into the pool. */
  since: number;
  /**
   * When per-day production was last settled (BRDC-BUILD-002's fishery token). Its own
   * clock because it advances a day at a time, not an hour. Absent on an old save — it
   * then starts from `since`.
   */
  sinceDay?: number;
}

/** The hourly trickle is settled an hour at a time; a partial hour waits for the rest. */
const SETTLE_MS = 3_600_000;
const SETTLE_DAY_MS = 86_400_000;

/**
 * Bring a stored pool up to date.
 *
 * The same shape as decay — nothing runs on a timer, the answer is computed from the
 * clock whenever it is asked for — with one deliberate difference: this one *is* written
 * back. Resources are earned and kept, so re-deriving them would be double payment
 * rather than double punishment.
 *
 * Which is exactly what an earlier version did. It credited the whole elapsed span but
 * advanced `since` only by whole hours, so every unsettled minute was paid again on the
 * next read, and a HUD that settles on each render mints resources for standing still.
 * Pay for whole hours, move the clock by those same hours, and leave the remainder
 * where it is.
 */
export function settleResources(
  state: ResourceState,
  owned: readonly Cell[],
  now: number,
  cap: number = BASE_STORAGE_CAP,
  bonusPerHour: Partial<ResourcePool> = {},
  bonusPerDay: Partial<ResourcePool> = {},
  /** A dark-time multiplier on everything produced (BRDC-EVENT-001). 1 the rest of the year. */
  factor = 1,
): ResourceState {
  const sinceDay = state.sinceDay ?? state.since;
  if (now <= state.since && now <= sinceDay) return state;

  // Two independent clocks. Each advances a whole unit at a time — settle every hour or
  // once a day, the total is the same — and when its production is off it jumps to `now`,
  // so a fishery built later cannot cash in a month of tokens. `bonusPerHour` is already
  // dormancy-filtered by the caller (BUILD-001).
  const hourlyOn =
    owned.some((c) => now - c.lastVisitedAt <= DORMANT_AFTER_MS && resourceForCell(c) !== null) ||
    RESOURCE_KINDS.some((k) => (bonusPerHour[k] ?? 0) > 0);
  const dailyOn = RESOURCE_KINDS.some((k) => (bonusPerDay[k] ?? 0) > 0);

  const paidHourMs = hourlyOn
    ? Math.floor(Math.max(0, now - state.since) / SETTLE_MS) * SETTLE_MS
    : 0;
  const paidDayMs = dailyOn
    ? Math.floor(Math.max(0, now - sinceDay) / SETTLE_DAY_MS) * SETTLE_DAY_MS
    : 0;

  const nextSince = hourlyOn ? state.since + paidHourMs : Math.max(state.since, now);
  const nextSinceDay = dailyOn ? sinceDay + paidDayMs : Math.max(sinceDay, now);

  if (nextSince === state.since && nextSinceDay === sinceDay) return state;
  if (paidHourMs <= 0 && paidDayMs <= 0) {
    return { pool: state.pool, since: nextSince, sinceDay: nextSinceDay };
  }

  const pool = { ...state.pool };
  if (paidHourMs > 0) {
    const earned = trickle(owned, paidHourMs, now);
    const hours = paidHourMs / SETTLE_MS;
    for (const k of RESOURCE_KINDS) {
      const raw = earned[k] + (bonusPerHour[k] ?? 0) * hours;
      pool[k] = Math.min(cap, pool[k] + Math.floor(raw * factor));
    }
  }
  if (paidDayMs > 0) {
    const days = paidDayMs / SETTLE_DAY_MS;
    for (const k of RESOURCE_KINDS) {
      pool[k] = Math.min(cap, pool[k] + Math.floor((bonusPerDay[k] ?? 0) * days * factor));
    }
  }

  return { pool, since: nextSince, sinceDay: nextSinceDay };
}

/** Can this pool afford that cost? */
export function canAfford(pool: ResourcePool, cost: Partial<ResourcePool>): boolean {
  return (Object.keys(cost) as ResourceKind[]).every((k) => pool[k] >= (cost[k] ?? 0));
}

/** Spend, or return null when the pool cannot cover it. Never goes negative. */
export function spend(pool: ResourcePool, cost: Partial<ResourcePool>): ResourcePool | null {
  if (!canAfford(pool, cost)) return null;
  const next = { ...pool };
  for (const k of Object.keys(cost) as ResourceKind[]) next[k] -= cost[k] ?? 0;
  return next;
}

/* --- Real terrain from vector tiles (BRDC-TERRAIN-002) ------------------- */

export interface TileFeature {
  /** The tile source-layer, e.g. `water`, `landcover`, `landuse`, `poi`. */
  sourceLayer?: string;
  /** `null` is allowed so a raw MapLibre feature list can be passed straight in. */
  properties?: Record<string, unknown> | null;
}

const has = (set: readonly string[], value: unknown): boolean =>
  typeof value === 'string' && set.includes(value);

/**
 * Read a kind out of the vector-tile features under a point, or `null` when the tiles say
 * nothing and the hash should stand in.
 *
 * Tolerant of the common OpenMapTiles-style schema: a `sourceLayer` plus a `class` /
 * `subclass` / `natural` / `landuse` property. Order matters — water and coastline are
 * checked before land cover, because a shoreline feature carries both.
 *
 * Hill and mountain come from tags, not elevation — the tiles carry no height model
 * (`BRDC-TERRAIN-002`: "ei korkeusdataa"). `natural=peak|cliff|ridge` is a mountain;
 * scrub, heath and moor read as hill. It is a guess, and the hash covers where it is
 * wrong.
 */
export function terrainFromTiles(features: readonly TileFeature[]): TerrainKind | null {
  const tags = features.map((f) => ({
    layer: f.sourceLayer ?? '',
    p: f.properties ?? {},
  }));

  const any = (test: (t: { layer: string; p: Record<string, unknown> }) => boolean) =>
    tags.some(test);

  if (any(({ layer, p }) => layer === 'water' && has(['ocean', 'sea'], p.class)) ||
      any(({ p }) => has(['coastline'], p.natural))) {
    return 'coast';
  }
  if (any(({ layer, p }) => layer === 'water' || layer === 'waterway' || has(['water'], p.natural))) {
    return 'lake';
  }
  if (any(({ p }) => has(['peak', 'cliff', 'ridge', 'rock', 'scree'], p.natural))) {
    return 'mountain';
  }
  if (any(({ layer, p }) =>
    (layer === 'landcover' || layer === 'landuse') && has(['wood', 'forest'], p.class ?? p.subclass) ||
    has(['wood'], p.natural))) {
    return 'forest';
  }
  if (any(({ p }) =>
    has(['scrub', 'heath', 'fell', 'moor', 'grassland'], p.natural) ||
    has(['meadow'], p.landuse ?? p.class))) {
    return 'hill';
  }
  if (any(({ layer, p }) =>
    layer === 'poi' && has(['marketplace'], p.class ?? p.subclass) ||
    has(['commercial', 'retail'], p.landuse ?? p.class) ||
    typeof p.shop === 'string')) {
    return 'market';
  }
  return null;
}
