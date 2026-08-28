/**
 * Cells to GeoJSON features. Pure, and therefore testable.
 *
 * Split out of TerritoryLayer because everything here is a decision — who owns what
 * colour, when a cell counts as contested, which properties the paint expressions read —
 * and decisions deserve tests. What is left in TerritoryLayer is MapLibre plumbing.
 */
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { resourceOf } from '@es3/core';
import { cellBoundary } from '@es3/core';
import type { Cell, PlayerId } from '@es3/core';

/** --cosmic-purple and a lifted version of it, inlined from tokens.css. */
export const OWN_FILL = '#4a1a5c';
export const OWN_STROKE = '#8b3fb8';
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
  /** The colour of what this ground yields, or null where it yields nothing. */
  yield: string | null;
}

/**
 * One colour per resource, and none for plain ground.
 *
 * Terrain deliberately does not repaint the hexagons: ownership owns the fill, and a map
 * where colour means two things at once means neither. It is a pip in the middle of a
 * cell you hold — enough to see that this one is a lake, not enough to argue with the
 * territory palette.
 */
export const YIELD_COLOUR: Readonly<Record<string, string>> = {
  water: '#4fc3dc',
  wood: '#7cbf63',
  gold: '#e0b04a',
};

/**
 * The arc of hue a rival can be given: cyan through blue and purple to magenta.
 *
 * Fixing lightness and saturation was not enough. The full circle includes olive,
 * mustard and brown, and a rival painted olive on a purple-and-cyan map does not look
 * like another player — it looks like a rendering fault. Restricting the arc keeps
 * every rival unmistakably part of the same world while staying easy to tell apart
 * from the player's own --cosmic-purple.
 */
export const HUE_MIN = 185;
export const HUE_MAX = 335;

/**
 * A stable hue per rival, inside the palette's arc.
 *
 * Deterministic from the id, so a rival keeps their colour between sessions without
 * anything being stored or synced.
 */
export function hueFor(id: PlayerId): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${HUE_MIN + (hash % (HUE_MAX - HUE_MIN))}, 38%, 46%)`;
}

export function cellProperties(cell: Cell, me: PlayerId | null): CellProperties {
  const mine = cell.ownerId !== null && cell.ownerId === me;
  return {
    strength: cell.strength,
    mine,
    contested: cell.ownerId !== null && cell.strength < CONTESTED_BELOW,
    // Unowned ground is drawn in the player's own colour at low strength, so a cell
    // released by the Void reads as available rather than as somebody else's.
    color: mine || cell.ownerId === null ? OWN_FILL : hueFor(cell.ownerId),
    // Only on ground the player holds: what a rival's land produces is their business.
    yield: mine ? (YIELD_COLOUR[resourceOf(cell.h3) ?? ''] ?? null) : null,
  };
}

export function cellToFeature(cell: Cell, me: PlayerId | null): Feature<Polygon, CellProperties> {
  return {
    type: 'Feature',
    id: cell.h3,
    properties: cellProperties(cell, me),
    geometry: { type: 'Polygon', coordinates: [cellBoundary(cell.h3)] },
  };
}

export function cellsToGeoJson(
  cells: readonly Cell[],
  me: PlayerId | null,
): FeatureCollection<Polygon, CellProperties> {
  return { type: 'FeatureCollection', features: cells.map((cell) => cellToFeature(cell, me)) };
}
