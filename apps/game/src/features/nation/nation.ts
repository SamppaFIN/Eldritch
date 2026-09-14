/**
 * The player's nation: a name and a flag (BRDC-NATION-001, BRDC-BANNER-001).
 *
 * Small enough for localStorage — one `es3:nation` key, the same shape whatever else
 * changes. The name is free text; an empty one still plays, shown as a wry default. The
 * flag is one of a fixed set of hand-drawn banners.
 */
import { load, saveNow } from '@es3/core';
import { REALM_MARKS, REALM_MARK_IDS, isRealmMark } from './realmMarks.js';
import type { RealmMarkId } from './realmMarks.js';

/** The six hand-drawn originals (BRDC-BANNER-001), untouched — a save pointing at one of
 *  these must keep resolving to the same art it always has. */
export type HandDrawnBannerId = 'vesica' | 'heptagram' | 'chevron' | 'pale' | 'eye' | 'triquetra';

/** A hand-drawn original or one of the eighteen generated marks (Sigil §04, BRDC-SIGIL-004). */
export type BannerId = HandDrawnBannerId | RealmMarkId;

const HAND_DRAWN_IDS: readonly HandDrawnBannerId[] = [
  'vesica',
  'heptagram',
  'chevron',
  'pale',
  'eye',
  'triquetra',
];

export const BANNER_IDS: readonly BannerId[] = [...HAND_DRAWN_IDS, ...REALM_MARK_IDS];

export interface Nation {
  name: string;
  bannerId: BannerId;
}

export const DEFAULT_NATION: Nation = { name: '', bannerId: 'vesica' };

const KEY = 'nation';
const NAME_MAX = 28;

/** An unknown or missing banner id falls back to the first one. */
export function resolveBannerId(id: unknown): BannerId {
  return BANNER_IDS.includes(id as BannerId) ? (id as BannerId) : 'vesica';
}

export function readNation(): Nation {
  const stored = load<Partial<Nation> | null>(KEY, null);
  return {
    name: typeof stored?.name === 'string' ? stored.name.slice(0, NAME_MAX) : '',
    bannerId: resolveBannerId(stored?.bannerId),
  };
}

export function writeNation(next: Nation): Nation {
  const clean: Nation = {
    name: next.name.trim().slice(0, NAME_MAX),
    bannerId: resolveBannerId(next.bannerId),
  };
  saveNow(KEY, clean);
  return clean;
}

/** What to show when the player has not named their nation. */
export function displayName(n: Nation): string {
  return n.name.trim() || 'The Nameless Reach';
}

/** A banner's name, said the way a person would — "first-seed" read aloud is nothing,
 *  and a hand-drawn id already reads as a plain word once capitalised. */
export function bannerName(id: BannerId): string {
  return isRealmMark(id) ? REALM_MARKS[id].name : `${id[0]?.toUpperCase()}${id.slice(1)}`;
}
