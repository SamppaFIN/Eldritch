/**
 * Display names for the things the game's rule tables only know by slug.
 *
 * `BUILDINGS`, `SPELLS` and the tech tree carry no copy of their own (`claude.md` §16 —
 * the rules are pure). These maps live in the app, and now in one place: the build and
 * rite panels and the action log all read the same words.
 */
import type { BuildingId, SpellId } from '@es3/core';

export const BUILDING_NAME: Readonly<Record<BuildingId, string>> = {
  granary: 'Granary',
  monument: 'Monument',
  storehouse: 'Storehouse',
  market: 'Market',
  sawmill: 'Sawmill',
  lumbermill: 'Lumbermill',
  mine: 'Mine',
  quarry: 'Quarry',
  farm: 'Farm',
  fishery: 'Fishery',
  vineyard: 'Vineyard',
  library: 'Library',
  'temple-grove': 'Temple Grove',
  lighthouse: 'Lighthouse',
  fortress: 'Fortress',
};

export const SPELL_NAME: Readonly<Record<SpellId, string>> = {
  insight: 'Insight',
  bulwark: 'Bulwark',
  snare: 'Snare',
  dominion: 'Dominion',
};

/** `early-farming` → `Early Farming`. Also the fallback for any bare slug. */
export const titleCase = (slug: string): string =>
  slug.replace(/(^|-)([a-z])/g, (_, sep: string, ch: string) => (sep ? ' ' : '') + ch.toUpperCase());
