/**
 * The player's nation: a name and a flag (BRDC-NATION-001, BRDC-BANNER-001).
 *
 * Small enough for localStorage — one `es3:nation` key, the same shape whatever else
 * changes. The name is free text; an empty one still plays, shown as a wry default. The
 * flag is one of a fixed set of hand-drawn banners.
 */
import { load, saveNow } from '@es3/core';

export type BannerId = 'vesica' | 'heptagram' | 'chevron' | 'pale' | 'eye' | 'triquetra';

export const BANNER_IDS: readonly BannerId[] = [
  'vesica',
  'heptagram',
  'chevron',
  'pale',
  'eye',
  'triquetra',
];

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
