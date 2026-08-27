/**
 * The ley-line on the map.
 *
 * One GeoJSON source, two line layers drawn from it: a wide blurred glow underneath and
 * a narrow bright core on top. Updates go through `setData` — never a new layer per
 * segment, which is how v2 ended up with thousands of DOM markers it then had to cap.
 */
import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { TrailPoint } from '@es3/core';

export const TRAIL_SOURCE = 'trail';
export const TRAIL_GLOW_LAYER = 'leyline-glow';
export const TRAIL_CORE_LAYER = 'leyline-core';

/*
 * Inlined from tokens.css; MapLibre parses CSS colours but not `var()`.
 *
 * The glow is --cosmic-purple lifted well past its token value. At #4a1a5c the hue is
 * darker than the buildings it crosses and the halo simply does not exist on a phone
 * in daylight; the same hue at higher lightness reads as light bleeding into the
 * world, which is the point of the thing.
 */
const GLOW = '#a04ad4'; // --cosmic-purple, hue held, lightness raised
const CORE = '#ffd700'; // --sacred-gold

function toGeoJson(points: readonly TrailPoint[]): FeatureCollection {
  // A single-point line is not a line. Emitting an empty collection keeps MapLibre
  // from warning on every fix until the second one arrives.
  if (points.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: points.map((p) => [p.lng, p.lat]),
        },
      },
    ],
  };
}

/** Idempotent: safe to call on every render, does nothing once the layers exist. */
export function ensureTrailLayers(map: MapLibreMap): void {
  if (map.getSource(TRAIL_SOURCE)) return;

  map.addSource(TRAIL_SOURCE, {
    type: 'geojson',
    data: toGeoJson([]),
    // The line is drawn in one piece and redrawn wholesale; there is nothing to cluster
    // and no need for MapLibre to keep feature ids around.
    generateId: false,
  });

  map.addLayer({
    id: TRAIL_GLOW_LAYER,
    type: 'line',
    source: TRAIL_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': GLOW,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 8, 16, 20, 19, 34],
      'line-blur': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 14, 19, 24],
      'line-opacity': 0.7,
    },
  });

  map.addLayer({
    id: TRAIL_CORE_LAYER,
    type: 'line',
    source: TRAIL_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': CORE,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.2, 16, 3, 19, 5],
      'line-opacity': 0.95,
    },
  });
}

export function setTrailData(map: MapLibreMap, points: readonly TrailPoint[]): void {
  const source = map.getSource(TRAIL_SOURCE);
  // `as` rather than a type guard: MapLibre's GeoJSONSource is the only thing this
  // source can be, since nothing else ever adds it.
  (source as { setData?: (d: FeatureCollection) => void })?.setData?.(toGeoJson(points));
}

export function removeTrailLayers(map: MapLibreMap): void {
  for (const id of [TRAIL_CORE_LAYER, TRAIL_GLOW_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(TRAIL_SOURCE)) map.removeSource(TRAIL_SOURCE);
}
