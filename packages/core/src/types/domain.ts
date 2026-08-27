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

export interface Cell {
  h3: H3Index;
  ownerId: PlayerId | null;
  strength: number;
  /** Epoch ms of the most recent visit by the owner. Decay measures from here. */
  lastVisitedAt: number;
  /** UTC calendar days (YYYY-MM-DD) the owner has passed through. */
  visitDays: string[];
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
