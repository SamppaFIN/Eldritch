/**
 * Carry one thing across (BRDC-SEASON-006, Eldritch-season.pdf S7).
 *
 * In the interregnum each realm chooses one heirloom — a small head start for the next
 * season, so veterans start ahead but not out of reach. It crosses once: chosen while the
 * season is sealed, spent the moment the new realm is founded.
 *
 * The Birch Relic reads "your first temple is dedicated at once, its tier I spell at rank
 * II"; a season-2 realm dedicates a whole school rather than one temple (PROG-007), so the
 * relic gives what that needs — Kindling learned and mana to learn and deepen a tier I rite.
 * Salt of the Shore's "clue cap 10 for week 1" is not carried: the cap stays 8.
 */
import type { LoreId } from './lore.js';
import type { ResourcePool } from './terrain.js';

export type HeirloomId = 'foundation-stone' | 'birch-relic' | 'watchmans-log' | 'salt-of-the-shore';

export interface Heirloom {
  name: string;
  text: string;
  keepLevel?: number;
  lore?: readonly LoreId[];
  pool?: Partial<ResourcePool>;
  clues?: number;
}

export const HEIRLOOMS: Readonly<Record<HeirloomId, Heirloom>> = {
  'foundation-stone': { name: 'Foundation Stone', text: 'Your Keep starts at level 2 — 9 housing on day one.', keepLevel: 2 },
  'birch-relic': { name: 'Birch Relic', text: 'Start with Kindling learned and the mana to learn and deepen a first rite.', lore: ['kindling'], pool: { mana: 80 } },
  'watchmans-log': { name: 'The Watchman’s Log', text: 'Start with 60 wisdom and Lookouts already learned.', lore: ['lookouts'], pool: { wisdom: 60 } },
  'salt-of-the-shore': { name: 'Salt of the Shore', text: 'Carry 3 clues into the season.', clues: 3 },
};

export const HEIRLOOM_IDS = Object.keys(HEIRLOOMS) as HeirloomId[];

/** What crosses: the heirloom and the season it was chosen at the end of. */
export interface Crossing {
  id: HeirloomId;
  fromSeason: number;
}
