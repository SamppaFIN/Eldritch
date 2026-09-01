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
import type { Cell, PlayerId } from '@es3/core';
import { CONTESTED_STROKE, OWN_STROKE, cellsToGeoJson } from './territoryFeatures.js';
import type { CellProperties } from './territoryFeatures.js';

export const CELL_SOURCE = 'cells';
export const CELL_FILL_LAYER = 'cells-fill';
export const CELL_LINE_LAYER = 'cells-line';
export const CELL_CONTESTED_LAYER = 'cells-contested';
export const CELL_ICON_LAYER = 'cells-icon';

/**
 * Below this, individual res-11 cells are smaller than a finger and stop being
 * information: a city block's worth collapses into a purple smudge. The fill stays so
 * the shape of a territory is still readable from above; the per-cell strokes go, which
 * is most of the drawing cost.
 */
export const CELL_DETAIL_MINZOOM = 13;

/** Idempotent. Safe to call whenever the map becomes ready. */
export function ensureTerritoryLayers(map: MapLibreMap): void {
  if (map.getSource(CELL_SOURCE)) return;

  map.addSource(CELL_SOURCE, { type: 'geojson', data: cellsToGeoJson([], null) });

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

  /*
   * What this ground is made of.
   *
   * A glyph, not a repaint. Ownership owns the fill of a hexagon; if terrain took it
   * over too, one colour would be answering two questions and a player could read
   * neither. The mark carries its meaning in shape and colour both — a plain circle
   * would leave the meaning in colour alone, which the accessibility rules forbid.
   * Shown on every visible cell (yours and the revealed ring), so "what is on the
   * next hex over" is answered without walking there. Nothing for plain ground.
   */
  map.addLayer({
    id: CELL_ICON_LAYER,
    type: 'symbol',
    source: CELL_SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    filter: ['!=', ['get', 'icon'], ''],
    layout: {
      'text-field': ['get', 'icon'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 17, 14, 19, 18],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': ['get', 'iconColor'],
      'text-halo-color': '#0a0612',
      'text-halo-width': 1.5,
      'text-opacity': 0.9,
    },
  });
}

export function setTerritoryData(
  map: MapLibreMap,
  cells: readonly Cell[],
  me: PlayerId | null,
): void {
  const source = map.getSource(CELL_SOURCE);
  (source as { setData?: (d: FeatureCollection<Polygon, CellProperties>) => void })?.setData?.(
    cellsToGeoJson(cells, me),
  );
}

export function removeTerritoryLayers(map: MapLibreMap): void {
  for (const id of [CELL_ICON_LAYER, CELL_CONTESTED_LAYER, CELL_LINE_LAYER, CELL_FILL_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(CELL_SOURCE)) map.removeSource(CELL_SOURCE);
}
