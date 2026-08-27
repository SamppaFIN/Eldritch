/**
 * Anchor Stone and Temples on the map.
 *
 * These are the cells the game worked out on its own, so they are drawn differently
 * from ground: a filled sigil rather than a tinted hexagon. claude.md §12 names the
 * shape for an Anchor — a Platonic solid — and geometry is meant to appear at moments,
 * not as wallpaper. There are only ever a handful of these.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellBoundary } from '@es3/core';
import type { RevealedPlace } from '@es3/core';

export const PLACE_SOURCE = 'places';
export const PLACE_HALO_LAYER = 'places-halo';
export const PLACE_CORE_LAYER = 'places-core';
export const PLACE_LABEL_LAYER = 'places-label';

/** --sacred-gold for the Anchor, --mystic-cyan for temples. */
const ANCHOR = '#ffd700';
const TEMPLE = '#00d4ff';

/** Centre of a cell, from its own boundary. Good enough for a marker. */
function centreOf(h3: string): [number, number] {
  const ring = cellBoundary(h3);
  let lng = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lng += x;
    lat += y;
  }
  return [lng / ring.length, lat / ring.length];
}

function toGeoJson(places: readonly RevealedPlace[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      id: place.h3,
      properties: {
        kind: place.kind,
        color: place.kind === 'anchor' ? ANCHOR : TEMPLE,
        label: place.kind === 'anchor' ? 'ANCHOR STONE' : `TEMPLE ${place.rank}`,
        size: place.kind === 'anchor' ? 1 : 0.7,
      },
      geometry: { type: 'Point', coordinates: centreOf(place.h3) },
    })),
  };
}

export function ensurePlaceLayers(map: MapLibreMap): void {
  if (map.getSource(PLACE_SOURCE)) return;

  map.addSource(PLACE_SOURCE, { type: 'geojson', data: toGeoJson([]) });

  // A soft glow, so a place reads as lit rather than pinned.
  map.addLayer({
    id: PLACE_HALO_LAYER,
    type: 'circle',
    source: PLACE_SOURCE,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.18,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 26, 19, 44],
      'circle-blur': 0.8,
    },
  });

  map.addLayer({
    id: PLACE_CORE_LAYER,
    type: 'circle',
    source: PLACE_SOURCE,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.9,
      'circle-radius': ['*', ['get', 'size'], 7],
      'circle-stroke-color': '#0a0612',
      'circle-stroke-width': 2,
    },
  });

  /*
   * The name is the point.
   *
   * A player is meant to look at the map and realise "that is my temple" — a marker
   * with no name would leave them guessing at a dot.
   */
  map.addLayer({
    id: PLACE_LABEL_LAYER,
    type: 'symbol',
    source: PLACE_SOURCE,
    minzoom: 13,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-letter-spacing': 0.16,
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
      'text-opacity': 0.9,
    },
  });
}

export function setPlaceData(map: MapLibreMap, places: readonly RevealedPlace[]): void {
  const source = map.getSource(PLACE_SOURCE);
  (source as { setData?: (d: FeatureCollection<Point>) => void })?.setData?.(toGeoJson(places));
}

export function removePlaceLayers(map: MapLibreMap): void {
  for (const id of [PLACE_LABEL_LAYER, PLACE_CORE_LAYER, PLACE_HALO_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(PLACE_SOURCE)) map.removeSource(PLACE_SOURCE);
}
