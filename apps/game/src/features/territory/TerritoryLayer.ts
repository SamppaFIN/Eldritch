/**
 * Territory on the map — MapLibre plumbing only.
 *
 * One GeoJSON source holding every visible cell, and three layers reading it with
 * data-driven paint. This is where MapLibre earns its place over Leaflet: five thousand
 * hexagons is nothing on the GPU, and would have been five thousand DOM nodes before.
 *
 * Every decision — who gets which colour, when a cell counts as contested — lives in
 * territoryFeatures.ts, where it can be tested without a browser.
 */
import type { FeatureCollection, Point, Polygon } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Cell, H3Index, PlayerId } from '@es3/core';
import { CONTESTED_STROKE, OWN_STROKE, REVEAL_FILL } from './territoryFeatures.js';
import { cellMarksToGeoJson, cellsToGeoJson } from './cellMarks.js';
import type { CellProperties } from './territoryFeatures.js';
import { BANNER_IDS } from '../nation/nation.js';
import type { BannerId } from '../nation/nation.js';
import {
  addBannerSprites,
  addBountySprites,
  bannerSpriteId,
  setFlagBanner,
  sharedPatternImage,
} from './territoryImages.js';
export { setFlagBanner } from './territoryImages.js';

// The names live in `layerIds.ts` so `territoryImages.ts` can read them without importing
// this file back — one id string in two places is how a layer quietly stops being toggled.
import {
  CELL_MARK_SOURCE,
  CELL_SOURCE,
  CELL_FILL_LAYER,
  CELL_SHARED_LAYER,
  CELL_BLIGHT_LAYER,
  CELL_LINE_LAYER,
  CELL_RIVAL_LINE_LAYER,
  CELL_OWN_LINE_LAYER,
  CELL_CONTESTED_LAYER,
  CELL_ICON_LAYER,
  CELL_GROUND_LAYER,
  CELL_BUILDING_LAYER,
  CELL_BOUNTY_LAYER,
  CELL_LANDMARK_LAYER,
  CELL_FLAG_LAYER,
  CELL_ANOMALY_LAYER,
  CELL_DETAIL_MINZOOM,
} from './layerIds.js';
import { addMarkLayers } from './territoryMarks.js';

export {
  CELL_SOURCE,
  CELL_FILL_LAYER,
  CELL_SHARED_LAYER,
  CELL_BLIGHT_LAYER,
  CELL_LINE_LAYER,
  CELL_CONTESTED_LAYER,
  CELL_ICON_LAYER,
  CELL_GROUND_LAYER,
  CELL_BUILDING_LAYER,
  CELL_BOUNTY_LAYER,
  CELL_LANDMARK_LAYER,
  CELL_FLAG_LAYER,
  CELL_ANOMALY_LAYER,
  CELL_DETAIL_MINZOOM,
} from './layerIds.js';

/** The `map.addImage` id for the shared-ground checkerboard. */
const SHARED_PATTERN = 'cells-shared-pattern';

// The fill stays visible below CELL_DETAIL_MINZOOM so a territory's shape still reads
// from above; the per-cell strokes and marks go, which is most of the drawing cost.

/** Idempotent. Safe to call whenever the map becomes ready. */
export function ensureTerritoryLayers(map: MapLibreMap): void {
  if (map.getSource(CELL_SOURCE)) return;

  map.addSource(CELL_SOURCE, { type: 'geojson', data: cellsToGeoJson([], null) });
  // The marks ride their own point source, so a hexagon wider than a tile cannot have
  // its glyphs placed twice (BRDC-SIGIL-006).
  map.addSource(CELL_MARK_SOURCE, { type: 'geojson', data: cellMarksToGeoJson([], null) });
  if (!map.hasImage(SHARED_PATTERN)) map.addImage(SHARED_PATTERN, sharedPatternImage());
  /*
   * Terrain no longer covers the hex (Sigil §03: "Terrain never fills the hex; it tints
   * the iso plinth under whatever stands there. Empty ground keeps the map visible
   * through it — that is the point of claiming it").
   *
   * `addTerrainSprites` is what made the ground layer visible, so not calling it leaves
   * it at its own `visibility: 'none'` — one line to put back if the field disagrees. It
   * also spares seven image decodes at map open, which the phone will not miss.
   */
  void addBannerSprites(map);
  void addBountySprites(map);

  // Below the trail, which is added later and therefore sits on top: the ley-line is
  // what the player is drawing right now and must never be buried by their own ground.
  map.addLayer({
    id: CELL_FILL_LAYER,
    type: 'fill',
    source: CELL_SOURCE,
    paint: {
      'fill-color': ['get', 'color'],
      /*
       * Flat, per state, the way the document draws it: yours .32, a rival's .22, ground
       * you only border .04.
       *
       * It used to ramp with strength, which was the right call when nothing else said
       * how well a cell was held. The arc along the lower edges says it now, and better —
       * so the fill goes back to answering one question, which is whose ground this is.
       */
      'fill-opacity': [
        'case',
        ['get', 'mine'],
        0.32,
        ['==', ['get', 'color'], REVEAL_FILL],
        0.04,
        0.22,
      ],
    },
  });

  // Over the base fill, only where a Wager import and your own walking both claim the
  // ground: the checkerboard reads as "part yours, part theirs" without a third colour.
  map.addLayer({
    id: CELL_SHARED_LAYER,
    type: 'fill',
    source: CELL_SOURCE,
    filter: ['get', 'shared'],
    paint: { 'fill-pattern': SHARED_PATTERN, 'fill-opacity': 0.75 },
  });

  /*
   * The blight (BRDC-BLIGHT-001) — decay wearing a face. A near-black wash over a cell
   * that has gone too long unwalked, deepening with the days and worse at the border of
   * your ground. Above the fill, below the strokes, so the dashed `contested` line still
   * reads on top. `blight` is 0..1; a single visit clears it.
   */
  map.addLayer({
    id: CELL_BLIGHT_LAYER,
    type: 'fill',
    source: CELL_SOURCE,
    filter: ['>', ['get', 'blight'], 0.02],
    paint: {
      'fill-color': '#0a0612',
      'fill-opacity': ['*', ['get', 'blight'], 0.6],
    },
  });

  map.addLayer({
    id: CELL_LINE_LAYER,
    type: 'line',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    paint: {
      /* 3px where the ground is someone's, 1.4 where it is merely seen (Sigil hexStates).
         The old 1.4/0.8 was a hairline at arm's length in daylight. */
      'line-color': ['case', ['get', 'mine'], OWN_STROKE, ['get', 'color']],
      'line-width': ['case', ['==', ['get', 'color'], REVEAL_FILL], 1.4, 3],
      'line-opacity': 0.9,
    },
  });

  /*
   * A rival's border is dashed — "hostile at a glance" (Sigil hexStates).
   *
   * Its own layer because `line-dasharray` is not a data-driven property in MapLibre: one
   * dash pattern per layer, so "dashed only for rivals" has to be a filtered layer rather
   * than a case expression. Same width and colour as the solid stroke below it; the dash
   * is the only difference, and it is the whole point.
   */
  map.addLayer({
    id: CELL_RIVAL_LINE_LAYER,
    type: 'line',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['all', ['!', ['get', 'mine']], ['!=', ['get', 'color'], REVEAL_FILL]],
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 3,
      'line-dasharray': [9, 5],
      'line-opacity': 0.95,
    },
  });

  /*
   * Your owner stroke, solid, on top (Sigil §03: "Yours: … solid 3.5px stroke. Rival:
   * one fixed pale red, dashed."). Every hex draws its whole outline, so an edge you
   * share with a rival carries both strokes — and with the dashes drawn last, your own
   * border read as red-striped. This layer is the same purple, laid after them.
   */
  map.addLayer({
    id: CELL_OWN_LINE_LAYER,
    type: 'line',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['get', 'mine'],
    paint: {
      'line-color': OWN_STROKE,
      'line-width': 3.5,
      'line-opacity': 0.95,
    },
  });

  /*
   * Contested cells get a second stroke rather than only a different colour.
   *
   * Colour alone must never carry meaning (AI-Koulu ch.4), and this is the one piece of
   * map state a player genuinely needs to read at a glance in daylight.
   */
  map.addLayer({
    id: CELL_CONTESTED_LAYER,
    type: 'line',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['get', 'contested'],
    paint: {
      'line-color': CONTESTED_STROKE,
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 0.85,
    },
  });

  addMarkLayers(map);
}

export function setTerritoryData(
  map: MapLibreMap,
  cells: readonly Cell[],
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
  bannerId: BannerId | null = null,
  /** Cells this player has revealed (BRDC-SIGIL-003) — gates the bounty layer. */
  revealed: Readonly<Record<H3Index, number>> = {},
  /** The Temple and the Anchor (BRDC-SIGIL-006): no banner on the hex they stand on. */
  places: readonly { h3: H3Index }[] = [],
): void {
  const placeCells = new Set(places.map((p) => p.h3));
  const source = map.getSource(CELL_SOURCE);
  (source as { setData?: (d: FeatureCollection<Polygon, CellProperties>) => void })?.setData?.(
    cellsToGeoJson(cells, me, now, home, revealed, placeCells),
  );
  const marks = map.getSource(CELL_MARK_SOURCE);
  (marks as { setData?: (d: FeatureCollection<Point, CellProperties>) => void })?.setData?.(
    cellMarksToGeoJson(cells, me, now, home, revealed, placeCells),
  );
  if (bannerId) setFlagBanner(map, bannerId);
}

export function removeTerritoryLayers(map: MapLibreMap): void {
  for (const id of [
    CELL_ANOMALY_LAYER,
    CELL_FLAG_LAYER,
    CELL_BOUNTY_LAYER,
    CELL_BUILDING_LAYER,
    CELL_LANDMARK_LAYER,
    CELL_GROUND_LAYER,
    CELL_ICON_LAYER,
    CELL_CONTESTED_LAYER,
    CELL_LINE_LAYER,
    CELL_BLIGHT_LAYER,
    CELL_SHARED_LAYER,
    CELL_FILL_LAYER,
  ]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  // Every layer still reading either cell source. The hand-kept list above had fallen
  // several layers behind, and removeSource throws while any layer still reads it.
  for (const layer of map.getStyle()?.layers ?? []) {
    if ('source' in layer && (layer.source === CELL_SOURCE || layer.source === CELL_MARK_SOURCE)) {
      map.removeLayer(layer.id);
    }
  }
  if (map.getSource(CELL_SOURCE)) map.removeSource(CELL_SOURCE);
  if (map.getSource(CELL_MARK_SOURCE)) map.removeSource(CELL_MARK_SOURCE);
  if (map.hasImage(SHARED_PATTERN)) map.removeImage(SHARED_PATTERN);
  for (const id of BANNER_IDS) {
    if (map.hasImage(bannerSpriteId(id))) map.removeImage(bannerSpriteId(id));
  }
}
