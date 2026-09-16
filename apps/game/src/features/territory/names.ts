/**
 * Display names for the things the game's rule tables only know by slug.
 *
 * `BUILDINGS`, `SPELLS` and the tech tree carry no copy of their own (`claude.md` §16 —
 * the rules are pure). These maps live in the app, and now in one place: the build and
 * rite panels and the action log all read the same words.
 */
import type { BuildingId, SpellId, TerrainKind } from '@es3/core';

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
  forgeheart: 'Forgeheart',
  wellspring: 'Wellspring',
  greenwake: 'Greenwake',
  snare: 'Snare',
  dominion: 'Dominion',
  farsight: 'Farsight',
  quickening: 'Quickening',
  scrying: 'Scrying',
  aegis: 'Aegis',
};

/** `early-farming` → `Early Farming`. Also the fallback for any bare slug. */
export const titleCase = (slug: string): string =>
  slug.replace(/(^|-)([a-z])/g, (_, sep: string, ch: string) => (sep ? ' ' : '') + ch.toUpperCase());

/**
 * What the ground is called, in the two registers the game actually uses.
 *
 * A card headline has room to say *Bare hillside*; a ledger row eighty pixels wide wants
 * *Hill*. Both are right, which is why there are two tables and not one — but there were
 * **four**, two copies of each, and the long pair had already drifted: `CellHeader` said
 * "Bare hillside" while `DiscoveryModal` said "A bare hillside" for the same terrain on
 * the same day. That is what a copied table does, and the only reliable fix is to stop
 * having copies (BRDC-LANDS-003, same call as `RESOURCE_WORD`).
 */
export const TERRAIN_NAME: Readonly<Record<TerrainKind, string>> = {
  plain: 'Plain',
  forest: 'Forest',
  hill: 'Hill',
  mountain: 'Mountain',
  lake: 'Lake',
  coast: 'Coast',
  market: 'Market',
  marsh: 'Marsh',
  settlement: 'Settlement',
};

/** The same ground, said the way a cell card and a discovery say it. */
export const GROUND_NAME: Readonly<Record<TerrainKind, string>> = {
  plain: 'Plain ground',
  forest: 'Old woodland',
  hill: 'Bare hillside',
  mountain: 'Broken rock',
  lake: 'Still water',
  coast: 'The shoreline',
  market: 'A place of trade',
  marsh: 'Wet ground',
  settlement: 'Rows of houses',
};
