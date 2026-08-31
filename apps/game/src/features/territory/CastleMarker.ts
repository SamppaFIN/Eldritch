/**
 * The Keep — a public decoy, drawn as its own marker, never as the Anchor.
 *
 * Kept apart from PlaceMarkers.ts on purpose. Anchor and Temple are things the game
 * worked out from how long the player stood somewhere (a `RevealedPlace`); the Keep is
 * assigned once, at random, and carries none of that meaning — folding it into
 * `RevealedPlace` would give it a `dwellMs` and a `rank` that mean nothing.
 *
 * Visually it borrows PlaceMarkers' halo-plus-core language rather than inventing new
 * art: BRDC-CASTLE-001 needs it to be visible and unmistakably not the Anchor, not
 * styled — that pass is BRDC-ART-001's, across every marker at once.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellBoundary } from '@es3/core';
import type { H3Index } from '@es3/core';

export const CASTLE_SOURCE = 'castle';
export const CASTLE_HALO_LAYER = 'castle-halo';
export const CASTLE_CORE_LAYER = 'castle-core';
export const CASTLE_LABEL_LAYER = 'castle-label';

/** --awareness-green. Distinct from the Anchor's gold and a Temple's cyan. */
const KEEP_COLOR = '#00ff88';

/** Centre of a cell, from its own boundary. Good enough for a marker. */
function centreOf(h3: H3Index): [number, number] {
  const ring = cellBoundary(h3);
  let lng = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lng += x;
    lat += y;
  }
  return [lng / ring.length, lat / ring.length];
}

function toGeoJson(castle: H3Index | null): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: castle
      ? [
          {
            type: 'Feature',
            id: castle,
            properties: {},
            geometry: { type: 'Point', coordinates: centreOf(castle) },
          },
        ]
      : [],
  };
}

export function ensureCastleLayer(map: MapLibreMap): void {
  if (map.getSource(CASTLE_SOURCE)) return;

  map.addSource(CASTLE_SOURCE, { type: 'geojson', data: toGeoJson(null) });

  map.addLayer({
    id: CASTLE_HALO_LAYER,
    type: 'circle',
    source: CASTLE_SOURCE,
    paint: {
      'circle-color': KEEP_COLOR,
      'circle-opacity': 0.18,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 26, 19, 44],
      'circle-blur': 0.8,
    },
  });

  map.addLayer({
    id: CASTLE_CORE_LAYER,
    type: 'circle',
    source: CASTLE_SOURCE,
    paint: {
      'circle-color': KEEP_COLOR,
      'circle-opacity': 0.9,
      'circle-radius': 7,
      'circle-stroke-color': '#0a0612',
      'circle-stroke-width': 2,
    },
  });

  map.addLayer({
    id: CASTLE_LABEL_LAYER,
    type: 'symbol',
    source: CASTLE_SOURCE,
    minzoom: 13,
    layout: {
      'text-field': 'THE KEEP',
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-letter-spacing': 0.16,
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': KEEP_COLOR,
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
      'text-opacity': 0.9,
    },
  });
}

export function setCastleData(map: MapLibreMap, castle: H3Index | null): void {
  const source = map.getSource(CASTLE_SOURCE);
  (source as { setData?: (d: FeatureCollection<Point>) => void })?.setData?.(toGeoJson(castle));
}

export function removeCastleLayer(map: MapLibreMap): void {
  for (const id of [CASTLE_LABEL_LAYER, CASTLE_CORE_LAYER, CASTLE_HALO_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(CASTLE_SOURCE)) map.removeSource(CASTLE_SOURCE);
}
