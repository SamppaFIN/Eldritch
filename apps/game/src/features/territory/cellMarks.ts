/**
 * One point per cell, and the slots the marks stand in (BRDC-SIGIL-006).
 *
 * Two problems, one cause, one fix.
 *
 * **The doubling.** Every mark used to be a symbol layer reading the `cells` polygon
 * source, letting MapLibre derive each label's anchor from the hexagon itself. A GeoJSON
 * source is tiled at 512 px, and a res-11 hex is about 690 px across at zoom 20 — wider
 * than a tile. So the hexagon is clipped into two tiles, each tile computes an anchor for
 * its own slice, and with `text-allow-overlap` set (which every one of these layers needs)
 * nothing dedupes them. The result is what Infinite photographed: every figure, every
 * glyph, drawn twice a few dozen pixels apart, and only when zoomed in far enough for the
 * hex to outgrow a tile.
 *
 * A point cannot be clipped into two tiles. Moving the marks onto their own point source
 * removes the failure rather than tuning around it.
 *
 * **The collisions.** Infinite: *"laita joku malli millä tiedot ei rendaa päällekkäin."*
 * Each layer used to pick its own `text-translate`, so "upper-left" was written out four
 * times in four numbers and two marks could quietly land in one corner — which is exactly
 * how the find ended up under the neighbour count once already. `SLOT` replaces that with
 * a table: six places around the hex plus the centre, named, each used by one thing. Two
 * marks in one slot is now a thing you can see in a list instead of a thing you discover
 * in a screenshot.
 *
 * The offsets scale with zoom because they are pixel offsets against a hex whose size on
 * screen doubles every level. So the interpolation is exponential, base 2 — a linear ramp
 * between two stops is wrong everywhere between them (at zoom 17 it put a slot 145 px out
 * on a hex whose real radius there is 87).
 */
import { cellBoundary, cellCentre, fortified, neighboursOf } from '@es3/core';
import { cellProperties } from './territoryFeatures.js';
import type { CellProperties } from './territoryFeatures.js';
import type { Cell, H3Index, PlayerId } from '@es3/core';
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { CELL_NEIGHBOUR_DISC_LAYER } from './layerIds.js';

/**
 * Where a mark stands, as a fraction of the hex's radius.
 *
 * Fractions rather than pixels so one table serves every zoom: the renderer multiplies
 * by the hex's on-screen radius. Screen axes — y grows downward.
 */
export type SlotName =
  | 'centre'
  | 'north'
  | 'northEast'
  | 'southEast'
  | 'south'
  | 'southWest'
  | 'northWest';

export const SLOT: Readonly<Record<SlotName, readonly [number, number]>> = {
  centre: [0, 0],
  north: [0, -0.72],
  northEast: [0.62, -0.36],
  southEast: [0.62, 0.36],
  south: [0, 0.72],
  southWest: [-0.62, 0.36],
  northWest: [-0.62, -0.36],
};

/**
 * The hex's on-screen radius, centre to vertex, in CSS pixels.
 *
 * *Measured*, with `map.project()` on a real cell at latitude 61 in the running game:
 * 43.5 / 86.9 / 173.9 / 347.8 px at zoom 16 / 17 / 18 / 19. The first version of this
 * derived them from metres-per-pixel on the 256 px tile convention and came out exactly
 * half — MapLibre tiles at 512. Every size built on that table was half what it claimed.
 */
const RADIUS_PX_Z16 = 43.5;
const RADIUS_PX_Z19 = RADIUS_PX_Z16 * 8;

/**
 * A slot as a MapLibre `translate` expression: the same place at every zoom.
 *
 * Deliberately capped at zoom 19 rather than extrapolated. Beyond it the hex is bigger
 * than the screen, and pushing a mark to 0.72 of a radius would send it off the edge —
 * past that point the marks stay where they are and the hexagon grows around them.
 */
type SlotExpression = [
  'interpolate',
  ['exponential', number],
  ['zoom'],
  number,
  ['literal', [number, number]],
  number,
  ['literal', [number, number]],
];

export function slotTranslate(slot: SlotName): SlotExpression {
  const [fx, fy] = SLOT[slot];
  const at = (r: number): ['literal', [number, number]] => [
    'literal',
    [Math.round(fx * r), Math.round(fy * r)],
  ];
  return ['interpolate', ['exponential', 2], ['zoom'], 16, at(RADIUS_PX_Z16), 19, at(RADIUS_PX_Z19)];
}

/**
 * The same cells, as points at their centres, carrying the same properties.
 *
 * Properties are reused verbatim from `cellsToGeoJson` rather than recomputed: the
 * neighbour count and the border test need to see the whole set, that logic already
 * exists there, and two copies of it would be one bug waiting for a quiet afternoon.
 */
export function cellMarksToGeoJson(
  cells: readonly Cell[],
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
  revealed: Readonly<Record<H3Index, number>> = {},
  places?: ReadonlySet<H3Index>,
): FeatureCollection<Point, CellProperties> {
  // Built from the polygons so the dedupe and the neighbour counting happen once, in
  // one place. Indexing `cells` here would desync the moment that dedupe drops one.
  const polygons = cellsToGeoJson(cells, me, now, home, revealed, places);
  return {
    type: 'FeatureCollection',
    features: polygons.features.map((f) => {
      const centre = cellCentre(f.id as H3Index);
      return {
        type: 'Feature' as const,
        id: f.id,
        properties: f.properties,
        geometry: { type: 'Point' as const, coordinates: [centre.lng, centre.lat] },
      };
    }),
  };
}

/*
 * The polygons, and the feature builders both sources are made from — moved here from
 * `territoryFeatures.ts` when the dedupe below took that file past 400 lines. This file is
 * where the map's GeoJSON is built now; `territoryFeatures.ts` keeps the decisions
 * (colours, properties) and none of the shapes.
 */
export function cellToFeature(
  cell: Cell,
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
  isBorder = false,
  revealed: Readonly<Record<H3Index, number>> = {},
  placeHere = false,
): Feature<Polygon, CellProperties> {
  return {
    type: 'Feature',
    id: cell.h3,
    properties: cellProperties(cell, me, now, home, isBorder, revealed, placeHere),
    geometry: { type: 'Polygon', coordinates: [cellBoundary(cell.h3)] },
  };
}

export function cellsToGeoJson(
  cells: readonly Cell[],
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
  revealed: Readonly<Record<H3Index, number>> = {},
  /** Hexes a Temple or the Anchor stands on — no banner there (BRDC-SIGIL-006). */
  places?: ReadonlySet<H3Index>,
): FeatureCollection<Polygon, CellProperties> {
  // A border cell is one of mine with at least one neighbour I do not hold — the blight
  // creeps in from there, so it is drawn a little deeper (BRDC-BLIGHT-001).
  /*
   * One feature per hex, whatever the caller handed over (BRDC-SIGIL-006).
   *
   * Infinite asked the right question about a doubled hex — *"onko mahdollista, että
   * heksa on jostain syystä 2x käyttäjän omistuksessa"* — and the answer is that nothing
   * here ever guaranteed otherwise. `withFogOfWar` dedupes, but it is not the only path
   * in: an import, a scry and a live claim can each contribute a list, and the map is the
   * one place where the same hex arriving twice becomes two of everything on screen.
   *
   * Last write wins, which matches every other merge in the game.
   */
  const unique = [...new Map(cells.map((c) => [c.h3, c])).values()];
  const ownedH3 = new Set(unique.filter((c) => c.ownerId === me).map((c) => c.h3));
  const byH3 = new Map(unique.map((c) => [c.h3, c]));
  const isBorder = (c: Cell): boolean =>
    c.ownerId === me && neighboursOf(c.h3).some((n) => !ownedH3.has(n));
  return {
    type: 'FeatureCollection',
    features: unique.map((cell) => {
      const feature = cellToFeature(
        cell, me, now, home, isBorder(cell), revealed, places?.has(cell.h3) ?? false,
      );
      // Counted here rather than in `cellProperties`, which sees one cell and cannot know
      // what else you hold. `ownedH3` is already built above for the border test.
      const neighbours =
        cell.ownerId === me ? neighboursOf(cell.h3).filter((n) => ownedH3.has(n)).length : 0;
      // Ground under a Fortress does not decay, so the Void's stain has no business on it
      // (BRDC-BUILD-012). Decided here, because only this sees the neighbours.
      const blight = fortified(byH3, cell.h3) ? 0 : feature.properties.blight;
      return { ...feature, properties: { ...feature.properties, neighbours, blight } };
    }),
  };
}

/**
 * Where a name label goes in the layer stack: beneath the marks (BRDC-SIGIL-006).
 *
 * MapLibre places symbols from the top of the stack down, and a label only gets out of the
 * way of something placed *before* it. The neighbour count and the strength figure always
 * draw, so for a place name to yield to them — instead of printing "100 THE KEEP 100"
 * across them at zoom 16 — the names must sit below them in the stack, and the numbers
 * must take part in placement rather than ignore it.
 *
 * `undefined` when the marks are not on the map yet: a label added before them ends up
 * below them anyway.
 */
export function beneathMarks(map: MapLibreMap): string | undefined {
  return map.getLayer(CELL_NEIGHBOUR_DISC_LAYER) ? CELL_NEIGHBOUR_DISC_LAYER : undefined;
}
