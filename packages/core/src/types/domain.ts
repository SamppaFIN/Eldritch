/**
 * Shared domain types. Code vocabulary on the left of the table in CLAUDE.md;
 * the UI translates to lore words (trail -> Ley-line, cell -> Warded Cell).
 */

/** H3 index at H3_RES_OWNERSHIP (11) unless stated otherwise. */
export type H3Index = string;
export type PlayerId = string;
export type RunId = string;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrailPoint extends LatLng {
  /** Epoch milliseconds. */
  t: number;
  /** Reported horizontal accuracy in metres. */
  accuracy: number;
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type RunStatus = 'active' | 'closed' | 'abandoned';

export interface Run {
  id: RunId;
  startedAt: number;
  status: RunStatus;
  pointCount: number;
  distanceM: number;
}

/**
 * What the ground under a cell is made of (BRDC-TERRAIN-002). Lives here rather than in
 * rules/terrain.ts because `Cell` carries it and rules/terrain.ts imports `Cell`.
 */
export type TerrainKind =
  | 'plain'
  | 'forest'
  | 'hill'
  | 'mountain'
  | 'lake'
  | 'coast'
  | 'market';

/** Whether a cell's terrain was read from the map's vector tiles or stood in by a hash. */
export type TerrainSource = 'tiles' | 'hash' | 'seed';

export interface Terrain {
  kind: TerrainKind;
  source: TerrainSource;
}

/**
 * A building's id (BRDC-BUILD-001, -002). Lives here because `Cell` carries one and
 * rules/build.ts imports `Cell`. The table and rules are in rules/build.ts.
 */
export type BuildingId =
  | 'granary'
  | 'monument'
  | 'storehouse'
  | 'market'
  | 'sawmill'
  | 'lumbermill'
  | 'mine'
  | 'quarry'
  | 'farm'
  | 'fishery'
  | 'vineyard'
  // BRDC-BUILD-003: area-effect buildings
  | 'library'
  | 'temple-grove'
  | 'lighthouse'
  // BRDC-BUILD-004: the defensive aura
  | 'fortress';

/**
 * What a building's area effect gives to the cells it covers. The resource kinds feed
 * `perHourBonus` (BRDC-BUILD-003); `defence` reduces incoming attack damage and is read
 * in the siege path instead (BRDC-BUILD-004).
 */
export type AuraKind = 'wisdom' | 'mana' | 'food' | 'defence';

/**
 * One entry in a cell's ownership history (BRDC-HEX-001). Lives here, not in
 * rules/history.ts, because `Cell` carries a list of them and rules/history.ts imports
 * `Cell`.
 */
export interface OwnershipChange {
  to: PlayerId;
  /** Who it was taken from, or `null` when it was claimed from unowned ground. */
  from: PlayerId | null;
  at: number;
  /** The attack power that broke it, or BASE_STRENGTH for a fresh claim. */
  power: number;
}

export interface Cell {
  h3: H3Index;
  ownerId: PlayerId | null;
  strength: number;
  /** Epoch ms of the most recent visit by the owner. Decay measures from here. */
  lastVisitedAt: number;
  /** UTC calendar days (YYYY-MM-DD) the owner has passed through. */
  visitDays: string[];
  /** Who first claimed this cell from nobody. Written once, never overwritten. */
  finder?: PlayerId;
  /** When `finder` claimed it. */
  revealedAt?: number;
  /**
   * Distinct UTC days the cell has been walked while held — the loyalty base
   * (BRDC-HEX-001, BRDC-BUILD-003). Not raw calendar days: an unwalked cell earns no
   * loyalty, and a stored day-set would grow without a ceiling. Cumulative across owners.
   */
  ownedDays?: number;
  /** Ownership changes, oldest first, capped at MAX_CELL_HISTORY. */
  history?: OwnershipChange[];
  /**
   * Came from `world.json`, not from this device (BRDC-SHARE-001). It is someone else's
   * truth, refreshed by cron; this device never sees its visits, so it must not be
   * decayed or released locally. Absent means local — no migration needed.
   */
  imported?: boolean;
  /**
   * Resolved terrain, once the map's tiles have been read for this cell
   * (BRDC-TERRAIN-002). Absent means "not resolved yet" — callers fall back to the hash
   * (`terrainForCell`). Additive, so no save migration.
   */
  terrain?: Terrain;
  /**
   * Both this player and an imported challenge claim this ground (BRDC-WAGER-JSON-002).
   * The local player keeps ownership; the hourly trickle is split by each side's
   * strength at the moment of import — the only "who has been here more" a one-shot
   * text challenge carries. Cleared by reinforcing the cell on a new day. Additive, no
   * migration.
   */
  shared?: { with: PlayerId; mineAtImport: number; theirsAtImport: number };
  /** The one building on this cell, if any (BRDC-BUILD-001). One cell, one building. */
  building?: { id: BuildingId; builtAt: number };
  /**
   * Decay-clock time bought by Bulwark spells (BRDC-SPELL-001), cumulative. Subtracted
   * from the cell's age in `projectCell` — the hours stay off the clock after the spell's
   * countdown ends. Additive, no migration.
   */
  shelteredMs?: number;
  /**
   * An anomaly the player is dealing with on this cell (BRDC-EVENT-001). Absent until
   * they start investigating. `startedAt` drives the progress clock; `stage` is the
   * event chain's position once one has opened; `done` marks it finished. Additive, no
   * migration.
   */
  anomaly?: { startedAt: number; stage?: number; done?: true };
}

export interface PlayerProfile {
  id: PlayerId;
  name: string;
  /** 0-359, used to derive this player's territory colour. */
  colorHue: number;
  level: number;
  xp: number;
}

/** Why a GPS point was not accepted. Surfaced in the HUD, not swallowed. */
export type RejectReason = 'accuracy' | 'speed' | 'interval' | 'consolidated';

export interface TrailResult {
  accepted: number;
  rejected: Array<{ reason: RejectReason; count: number }>;
  distanceM: number;
  /** Cells taken, reinforced or damaged by walking through them. */
  grown: CaptureOutcome[];
  /** Places that crossed a threshold during this batch, and so are news. */
  revealed: RevealedPlace[];
  /**
   * Time in this batch during which the page was frozen and nothing was recorded.
   *
   * Surfaced rather than hidden: it is the difference between a border the player can
   * trust and one with holes in it, and it is the only thing that tells them the
   * keepalive is worth turning on.
   */
  unobservedMs: number;
}

/**
 * A cell that has stopped being ground and become a place.
 *
 * Nothing is chosen from a menu: the game works out where you spend your life and says
 * so once it is sure.
 */
export interface RevealedPlace {
  h3: H3Index;
  kind: 'anchor' | 'temple';
  dwellMs: number;
  rank: number;
  /** Temple expansion level, 0..MAX_TEMPLE_EXPANSION (BRDC-MANA-001). Absent until read. */
  expansion?: number;
  /** Mana per hour this place produces at its current expansion. Absent until computed. */
  manaPerHour?: number;
}

export type CaptureOutcomeKind =
  | 'claimed' // was unowned
  | 'reinforced' // already ours, strength up
  | 'unchanged' // already ours, already visited today
  | 'damaged' // enemy cell, strength down but held
  | 'taken'; // enemy cell, strength hit 0, ownership flipped

export interface CaptureOutcome {
  h3: H3Index;
  kind: CaptureOutcomeKind;
  strengthBefore: number;
  strengthAfter: number;
  previousOwner: PlayerId | null;
}

export type ClaimResult =
  | { closed: false }
  | { closed: true; outcomes: CaptureOutcome[]; areaM2: number };

export interface DecayResult {
  /** Cells whose strength dropped but which are still owned. */
  weakened: H3Index[];
  /** Cells released back to the Void. */
  released: H3Index[];
}
