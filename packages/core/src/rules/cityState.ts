/**
 * City states — neighbours who are not players (BRDC-DIPLO-001).
 *
 * A city state is placed by hand, holds its ground permanently, and cannot be walked into
 * being. It is the first thing on this map that is *there* rather than generated: the
 * fishing village at Härmälänranta is a real harbour, and the game says so.
 *
 * Three things follow from being hand-placed rather than played:
 *
 * 1. **It never decays and never changes hands by walking.** Its cells carry `imported`,
 *    the same flag `world.json` ground uses, which `projectCell` already refuses to age.
 * 2. **Its ground is strong.** `MAX_STRENGTH` across the village — the watchtowers of the
 *    brief, expressed in the number the siege model already reads, rather than as a new
 *    kind of building nobody can build.
 * 3. **One hex is the door.** Diplomacy happens at the quay, not everywhere at once, so
 *    reaching a city state is a walk to a place rather than a menu.
 *
 * Pure: the table and the arithmetic. Placing the cells in the store is `cityStateStore`.
 */
import { MAX_STRENGTH } from './constants.js';
import type { ResourceKind, ResourcePool } from './terrain.js';
import { hexDistance } from '../geo/cells.js';
import type { H3Index, LatLng, PlayerId } from '../types/domain.js';

export type CityStateId = 'harmala-fishers';

export interface CityState {
  id: CityStateId;
  /** The owner id its cells carry. Prefixed so it can never collide with a player uuid. */
  owner: PlayerId;
  name: string;
  /** What kind of place it is, said the way a person would. */
  kind: string;
  blurb: string;
  centre: LatLng;
  /** Rings of cells it holds around `centre`. */
  radius: number;
  /** Where its quay is — the one hex diplomacy happens at. */
  door: LatLng;
  strength: number;
}

/**
 * Härmälänranta's harbour, on the shore the survey already calls `coast`
 * (`terrainSeed.ts`). A fishing village trades what it has too much of.
 */
export const CITY_STATES: readonly CityState[] = [
  {
    id: 'harmala-fishers',
    owner: 'city:harmala-fishers',
    name: 'Härmälänranta',
    kind: 'A fishing village',
    blurb:
      'Nets on every rail and the smell of the lake in the timber. They have more fish than they can eat and not enough of anything else.',
    centre: { lat: 61.4753, lng: 23.7272 },
    radius: 2,
    door: { lat: 61.4753, lng: 23.7272 },
    strength: MAX_STRENGTH,
  },
];

export function cityStateById(id: CityStateId): CityState | undefined {
  return CITY_STATES.find((c) => c.id === id);
}

/** The city state that owns this cell, by the owner id the cell carries. */
export function cityStateOf(ownerId: PlayerId | null): CityState | undefined {
  return ownerId ? CITY_STATES.find((c) => c.owner === ownerId) : undefined;
}

/** True when this owner is a city state rather than a player — they are never rivals. */
export function isCityState(ownerId: PlayerId | null): boolean {
  return cityStateOf(ownerId) !== undefined;
}

/* --- Trade (BRDC-DIPLO-001) --------------------------------------------- */

/**
 * What a parcel costs to swap.
 *
 * A quarter, because the loss has to be felt without being a punishment: twenty timber
 * buys fifteen fish, and a player who converts back and forth ends up with less than they
 * started — which is the whole reason a trade post is a choice rather than a button you
 * press in a loop.
 */
export const TRADE_LOSS = 0.25;

/** The parcel size. One number, so the arithmetic is never a surprise. */
export const TRADE_PARCEL = 20;

/** What `give` of one resource returns in another. */
export function tradeReturn(give: number): number {
  return Math.floor(give * (1 - TRADE_LOSS));
}

export type TradeRefusal = 'same-resource' | 'cannot-afford' | 'nothing-to-give';

export type TradeResult =
  | { ok: true; pool: ResourcePool; gave: number; got: number }
  | { ok: false; refused: TradeRefusal };

/**
 * Swap a parcel at the quay. Pure — the store seam writes it.
 *
 * Refuses rather than throwing, like every other rule here, and refuses *before* taking
 * anything: a trade that cannot complete must leave the pouch exactly as it was.
 */
export function trade(
  pool: ResourcePool,
  give: ResourceKind,
  want: ResourceKind,
  parcel: number = TRADE_PARCEL,
): TradeResult {
  if (give === want) return { ok: false, refused: 'same-resource' };
  if (parcel <= 0) return { ok: false, refused: 'nothing-to-give' };
  if ((pool[give] ?? 0) < parcel) return { ok: false, refused: 'cannot-afford' };

  const got = tradeReturn(parcel);
  const next = { ...pool };
  next[give] -= parcel;
  next[want] += got;
  return { ok: true, pool: next, gave: parcel, got };
}

/**
 * How far the quay is from a hex inside the village, in hexes.
 *
 * A village is nineteen cells and its quay is one of them, so without this the door is a
 * hunt — the same "the content is there and the screen does not show the way to it" that
 * BRDC-UI-002, -UI-003 and BUILD-010 each turned out to be.
 */
export function stepsToDoor(from: H3Index, door: H3Index): number {
  return hexDistance(from, door);
}
