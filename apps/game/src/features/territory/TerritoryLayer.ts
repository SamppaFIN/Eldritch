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
import type { FeatureCollection, Polygon } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { MAX_STRENGTH } from '@es3/core';
import type { Cell, H3Index, PlayerId } from '@es3/core';
import { CONTESTED_STROKE, OWN_STROKE, cellsToGeoJson } from './territoryFeatures.js';
import type { CellProperties } from './territoryFeatures.js';
import { BANNER_IDS } from '../nation/nation.js';
import type { BannerId } from '../nation/nation.js';
import {
  addBannerSprites,
  addBountySprites,
  addTerrainSprites,
  bannerSpriteId,
  setFlagBanner,
  sharedPatternImage,
} from './territoryImages.js';
export { setFlagBanner } from './territoryImages.js';

// The names live in `layerIds.ts` so `territoryImages.ts` can read them without importing
// this file back — one id string in two places is how a layer quietly stops being toggled.
import {
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
  if (!map.hasImage(SHARED_PATTERN)) map.addImage(SHARED_PATTERN, sharedPatternImage());
  void addBannerSprites(map);
  void addTerrainSprites(map);
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
       * Strength as opacity, with a floor that makes a fresh claim feel like one.
       *
       * A linear ramp from zero put a just-claimed cell (strength 100 of 500) at 0.17
       * on near-black, which is almost nothing to look at — a poor reward for the one
       * moment the game exists to deliver. The curve now rises fast to base strength
       * and then more slowly, so a new claim is unmistakable and a maxed one is richer
       * still without the map turning into a solid block of purple.
       */
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['get', 'strength'],
        0,
        0.1,
        100,
        0.32,
        MAX_STRENGTH,
        0.5,
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
      'line-color': ['case', ['get', 'mine'], OWN_STROKE, ['get', 'color']],
      'line-width': ['case', ['get', 'mine'], 1.4, 0.8],
      'line-opacity': 0.9,
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
): void {
  const source = map.getSource(CELL_SOURCE);
  (source as { setData?: (d: FeatureCollection<Polygon, CellProperties>) => void })?.setData?.(
    cellsToGeoJson(cells, me, now, home, revealed),
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
  if (map.getSource(CELL_SOURCE)) map.removeSource(CELL_SOURCE);
  if (map.hasImage(SHARED_PATTERN)) map.removeImage(SHARED_PATTERN);
  for (const id of BANNER_IDS) {
    if (map.hasImage(bannerSpriteId(id))) map.removeImage(bannerSpriteId(id));
  }
}
