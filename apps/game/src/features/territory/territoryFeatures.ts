/**
 * Cells to GeoJSON features. Pure, and therefore testable.
 *
 * Split out of TerritoryLayer because everything here is a decision — who owns what
 * colour, when a cell counts as contested, which properties the paint expressions read —
 * and decisions deserve tests. What is left in TerritoryLayer is MapLibre plumbing.
 */
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import {
  BLIGHT_EDGE_FACTOR,
  anomalyAt,
  blightLevel,
  emptyCell,
  neighboursOf,
  terrainOf,
  TERRAIN_TABLE,
} from '@es3/core';
import { cellBoundary } from '@es3/core';
import type { Cell, CaptureOutcome, H3Index, PlayerId, ResourceKind, TerrainKind } from '@es3/core';
import { buildingGlyph } from './buildingGlyphs.js';

/**
 * The cells a just-closed loop should flare gold, and when. `null` when the last claim
 * took no ground — a lap that only reinforced has nothing to light up. Pulled out of
 * MapView, which was at its line ceiling; pure, so it is tested here.
 */
export function awakeningReveal(
  claim: { outcomes: readonly CaptureOutcome[]; at: number } | null,
): { cells: H3Index[]; at: number } | null {
  if (!claim) return null;
  const cells = claim.outcomes
    .filter((o) => o.kind === 'claimed' || o.kind === 'taken')
    .map((o) => o.h3);
  return cells.length > 0 ? { cells, at: claim.at } : null;
}

/** --cosmic-purple and a lifted version of it, inlined from tokens.css. */
export const OWN_FILL = '#4a1a5c';
export const OWN_STROKE = '#8b3fb8';
/**
 * Any rival's ground, one fixed colour. A dark red, the same relation to `--danger`
 * (`oklch(0.65 0.21 25)`) that `OWN_FILL` is to `--cosmic-purple`. A hue arc per rival
 * was tried (BRDC-CLAIM-006) and dropped once real rival ground rendered: one "this is
 * hostile" signal reads faster than a rainbow nobody can tell apart outdoors.
 */
export const ENEMY_FILL = '#5c1a1a';
export const ENEMY_STROKE = '#a13b3b';
/**
 * Seen but not held — a cell revealed only by being next to yours. A neutral pale tone
 * (from `--glass-border`, `oklch(1 0 0 / 0.1)`), never `OWN_FILL`, so "explored,
 * unclaimed" stops looking identical to your own territory at low strength.
 */
export const REVEAL_FILL = '#cdc7d6';
/** --danger. The dashed stroke on a cell someone is walking on. */
export const CONTESTED_STROKE = '#d94a4a';

/**
 * Below base strength, someone has been walking on it.
 *
 * A cell only drops under 100 by being attacked or by decaying, and either way it is
 * worth the player's attention — this is the threshold the dashed stroke keys off.
 */
export const CONTESTED_BELOW = 100;

export interface CellProperties {
  strength: number;
  mine: boolean;
  contested: boolean;
  color: string;
  /** Terrain glyph, or `''` where the ground shows nothing (plain). */
  icon: string;
  /** The glyph's colour — the resource the terrain gives. `''` alongside an empty icon. */
  iconColor: string;
  /** Anomaly mark on your own ground: `◌` a site, `◐` under study, `✦` in a chain, `''` none. */
  anomaly: string;
  /** Building glyph (BRDC-ART-002), `''` when the cell has no building. On any owner's cell. */
  building: string;
  /** The building glyph's colour, by role. `''` alongside an empty building glyph. */
  buildingColor: string;
  /** Blight, 0..1 (BRDC-BLIGHT-001) — how far the Void has crept in. Rendering only. */
  blight: number;
}

/**
 * One colour per resource the ground can give. Drives both the map's terrain glyph and
 * the same glyph in `CellPanel`, so a lake reads the same colour in both places.
 */
export const RESOURCE_COLOUR: Readonly<Record<ResourceKind, string>> = {
  wood: '#7cbf63',
  stone: '#b8b0a0',
  iron: '#9aa7b3',
  food: '#6fcf8f',
  gold: '#e0b04a',
  wisdom: '#b98fd6',
  mana: '#00d4ff',
  culture: '#e08fb0',
  tokens: '#ffd700',
};

/** The word the pouch uses for each resource — "timber", not "wood". */
export const RESOURCE_WORD: Readonly<Record<ResourceKind, string>> = {
  wood: 'timber',
  stone: 'stone',
  iron: 'iron',
  food: 'food',
  gold: 'gold',
  wisdom: 'wisdom',
  mana: 'mana',
  culture: 'culture',
  tokens: 'tokens',
};

/** One glyph per terrain kind, from the same register as the HUD's `⬢ ⬡ ◈ ◇`. */
const TERRAIN_CHAR: Readonly<Record<TerrainKind, string>> = {
  plain: '',
  forest: '♣',
  hill: '△',
  mountain: '▲',
  lake: '≈',
  coast: '≈',
  market: '◆',
};

/**
 * The glyph and colour for a terrain kind, or `null` when there is nothing to show
 * (plain ground). Exported for `CellPanel`, which draws the same mark beside its
 * terrain description.
 */
export function terrainGlyph(kind: TerrainKind): { char: string; color: string } | null {
  const char = TERRAIN_CHAR[kind];
  if (!char) return null;
  const resource = TERRAIN_TABLE[kind].resource;
  return { char, color: resource ? RESOURCE_COLOUR[resource] : OWN_STROKE };
}

/**
 * Fog of war: the only cells the map draws are the ones you hold and the ring of cells
 * around them. Everything else is left as bare basemap.
 *
 * A neighbour with no stored cell of its own still appears — as `emptyCell(h3)` — so it
 * can carry the pale reveal tint and its terrain glyph. The full set stays available to
 * the rest of the game (selection, the rival compass); only what reaches the map is
 * narrowed here.
 */
export function withFogOfWar(all: readonly Cell[], owned: readonly Cell[]): Cell[] {
  const byH3 = new Map(all.map((c) => [c.h3, c]));
  const visible = new Set<string>();
  for (const cell of owned) {
    visible.add(cell.h3);
    for (const n of neighboursOf(cell.h3)) visible.add(n);
  }
  return [...visible].map((h3) => byH3.get(h3) ?? emptyCell(h3));
}

/**
 * The anomaly mark for one of your cells (BRDC-EVENT-001). Different glyphs, not just a
 * tint — the state has to read without colour. `''` for ground with nothing on it, and
 * for a finished anomaly.
 */
export function anomalyGlyphFor(cell: Cell): string {
  if (anomalyAt(cell.h3) === null) return '';
  const a = cell.anomaly;
  if (!a) return '◌';
  if (a.done) return '';
  return a.stage !== undefined ? '✦' : '◐';
}

export function cellProperties(
  cell: Cell,
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
  isBorder = false,
): CellProperties {
  const mine = cell.ownerId !== null && cell.ownerId === me;
  const rival = cell.ownerId !== null && !mine;
  const glyph = terrainGlyph(terrainOf(cell.h3).kind);
  // Shown on any owner's cell — a rival's building on a bordering hex is intel.
  const bg = cell.building ? buildingGlyph(cell.building.id) : null;
  return {
    strength: cell.strength,
    mine,
    contested: cell.ownerId !== null && cell.strength < CONTESTED_BELOW,
    // Three tiers: mine, a rival's, or seen-but-unclaimed. Strength drives opacity in
    // the paint expression, so a fresh reveal (strength 0) is naturally faint.
    color: mine ? OWN_FILL : rival ? ENEMY_FILL : REVEAL_FILL,
    icon: glyph?.char ?? '',
    iconColor: glyph?.color ?? '',
    anomaly: mine ? anomalyGlyphFor(cell) : '',
    building: bg?.char ?? '',
    buildingColor: bg?.color ?? '',
    blight: Math.min(1, blightLevel(cell, now, home) * (isBorder ? BLIGHT_EDGE_FACTOR : 1)),
  };
}

export function cellToFeature(
  cell: Cell,
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
  isBorder = false,
): Feature<Polygon, CellProperties> {
  return {
    type: 'Feature',
    id: cell.h3,
    properties: cellProperties(cell, me, now, home, isBorder),
    geometry: { type: 'Polygon', coordinates: [cellBoundary(cell.h3)] },
  };
}

export function cellsToGeoJson(
  cells: readonly Cell[],
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
): FeatureCollection<Polygon, CellProperties> {
  // A border cell is one of mine with at least one neighbour I do not hold — the blight
  // creeps in from there, so it is drawn a little deeper (BRDC-BLIGHT-001).
  const ownedH3 = new Set(cells.filter((c) => c.ownerId === me).map((c) => c.h3));
  const isBorder = (c: Cell): boolean =>
    c.ownerId === me && neighboursOf(c.h3).some((n) => !ownedH3.has(n));
  return {
    type: 'FeatureCollection',
    features: cells.map((cell) => cellToFeature(cell, me, now, home, isBorder(cell))),
  };
}
