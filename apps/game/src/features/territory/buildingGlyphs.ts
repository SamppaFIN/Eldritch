/**
 * A glyph and a colour for a building, drawn on its cell (BRDC-ART-002).
 *
 * The civilisation layer was invisible on the map — a built hex looked like an empty one.
 * This is the mark: one glyph per *role* (there are fifteen buildings, five roles), from
 * the same geometric register the terrain glyphs use, so it reads in the family.
 *
 * Font glyphs, not SVG: MapLibre symbol layers render text, and every glyph here is in
 * Noto Sans Regular, the face it bundles. §12's stroke-SVG is for the sacred-geometry
 * moments, not the map's data marks.
 */
import type { BuildingId } from '@es3/core';

export type BuildingRole = 'produce' | 'store' | 'knowledge' | 'defence' | 'culture';

export const BUILDING_ROLE: Readonly<Record<BuildingId, BuildingRole>> = {
  granary: 'produce',
  market: 'produce',
  sawmill: 'produce',
  lumbermill: 'produce',
  mine: 'produce',
  quarry: 'produce',
  farm: 'produce',
  fishery: 'produce',
  lighthouse: 'produce',
  storehouse: 'store',
  library: 'knowledge',
  'temple-grove': 'knowledge',
  fortress: 'defence',
  monument: 'culture',
  vineyard: 'culture',
};

/** Distinct from the terrain glyphs (`♣ △ ▲ ≈ ◆`) and the anomaly glyphs (`◌ ◐ ✦`). */
const ROLE_GLYPH: Readonly<Record<BuildingRole, string>> = {
  produce: '⚒',
  store: '▤',
  knowledge: '❋',
  defence: '▣',
  culture: '❦',
};

/** Same hexes as `RESOURCE_COLOUR` / the tokens — literal here to avoid an import cycle. */
const ROLE_COLOUR: Readonly<Record<BuildingRole, string>> = {
  produce: '#7cbf63', // wood-green
  store: '#b8b0a0', // stone
  knowledge: '#e8b64a', // sacred gold
  defence: '#d94a4a', // --danger
  culture: '#e08fb0', // culture pink
};

export function buildingGlyph(id: BuildingId): { char: string; color: string } {
  const role = BUILDING_ROLE[id];
  return { char: ROLE_GLYPH[role], color: ROLE_COLOUR[role] };
}
