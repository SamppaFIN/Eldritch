/**
 * The ley-line on the map.
 *
 * One GeoJSON source, two line layers drawn from it: a wide blurred glow underneath and
 * a narrow bright core on top. Updates go through `setData` — never a new layer per
 * segment, which is how v2 ended up with thousands of DOM markers it then had to cap.
 */
import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { OBSERVATION_GAP_MS } from '@es3/core';
import type { TrailPoint } from '@es3/core';

export const TRAIL_SOURCE = 'trail';
export const TRAIL_GLOW_LAYER = 'leyline-glow';
export const TRAIL_CORE_LAYER = 'leyline-core';
export const TRAIL_GAP_LAYER = 'leyline-gap';

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
const GAP = '#6b6480'; // grey: not a ley-line, because it was not walked in sight

/**
 * Split the trail where the game stopped watching.
 *
 * Two fixes ten minutes apart do not describe a walk between them — the phone was in a
 * pocket and the page was frozen. Joining them with the same bright line as ground that
 * was genuinely walked draws a border through streets nobody visited, and the player has
 * no way to tell which parts of their own map to believe.
 *
 * So the seam is drawn as what it is: a grey dashed thread, clearly not a ley-line.
 */
function toGeoJson(points: readonly TrailPoint[]): FeatureCollection {
  const features: FeatureCollection['features'] = [];
  let run: TrailPoint[] = [];

  const flush = () => {
    // A single-point line is not a line, and MapLibre warns about every one of them.
    if (run.length >= 2) {
      features.push({
        type: 'Feature',
        properties: { observed: true },
        geometry: { type: 'LineString', coordinates: run.map((p) => [p.lng, p.lat]) },
      });
    }
    run = [];
  };

  for (const point of points) {
    const last = run[run.length - 1];
    if (last && point.t - last.t >= OBSERVATION_GAP_MS) {
      features.push({
        type: 'Feature',
        properties: { observed: false },
        geometry: {
          type: 'LineString',
          coordinates: [
            [last.lng, last.lat],
            [point.lng, point.lat],
          ],
        },
      });
      flush();
    }
    run.push(point);
  }
  flush();

  return { type: 'FeatureCollection', features };
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

  // Underneath both ley-line layers, and filtered out of them, so a gap never glows.
  map.addLayer({
    id: TRAIL_GAP_LAYER,
    type: 'line',
    source: TRAIL_SOURCE,
    filter: ['!', ['get', 'observed']],
    layout: { 'line-cap': 'butt' },
    paint: {
      'line-color': GAP,
      'line-width': 1.5,
      'line-opacity': 0.55,
      'line-dasharray': [1, 3],
    },
  });

  map.addLayer({
    id: TRAIL_GLOW_LAYER,
    type: 'line',
    source: TRAIL_SOURCE,
    filter: ['get', 'observed'],
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
    filter: ['get', 'observed'],
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
  for (const id of [TRAIL_CORE_LAYER, TRAIL_GLOW_LAYER, TRAIL_GAP_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(TRAIL_SOURCE)) map.removeSource(TRAIL_SOURCE);
}
