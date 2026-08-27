/**
 * Cells to GeoJSON features. Pure, and therefore testable.
 *
 * Split out of TerritoryLayer because everything here is a decision — who owns what
 * colour, when a cell counts as contested, which properties the paint expressions read —
 * and decisions deserve tests. What is left in TerritoryLayer is MapLibre plumbing.
 */
import type { Feature, FeatureCollection, Polygon } from 'geojson';
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
}

/**
 * A stable hue per rival, desaturated toward the palette.
 *
 * Fully saturated per-player colours turn a contested neighbourhood into a fruit bowl
 * and stop it reading as the same world as everything else. Lightness and saturation are
 * fixed; only the hue moves. The hash is deterministic so a rival keeps their colour
 * between sessions without anything being stored.
 */
export function hueFor(id: PlayerId): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 38%, 42%)`;
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
