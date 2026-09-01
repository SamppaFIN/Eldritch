/**
 * The walked-path layer (BRDC-TRAIL-003).
 *
 * Not the live ley-line — that is one run's points and lives in `TrailLayer`. This is
 * every stretch a player has ever walked, drawn underneath everything they are drawing
 * now, thickening and warming from a faint footpath to a gold rail line the more it is
 * used. One GeoJSON source, a glow and a core, redrawn wholesale like the trail.
 *
 * The tier is carried per feature and the width and colour are `match` expressions on it,
 * so a thousand segments are still one style, not a thousand layers.
 */
import type { FeatureCollection } from 'geojson';
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { WalkedEdge } from '@es3/core';

export const PATH_SOURCE = 'walked-paths';
export const PATH_GLOW_LAYER = 'walked-glow';
export const PATH_CORE_LAYER = 'walked-core';

/*
 * Hue walks from ley-line purple to sacred gold as a track wears in: a path is a dim
 * violet thread, a rail reads as a proper gold road. Inlined hex — MapLibre parses CSS
 * colours but not the `var()` the tokens are expressed in.
 */
const TIER_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'tier'],
  'path', '#6a5a8e',
  'track', '#8a72a0',
  'road', '#b0908a',
  'avenue', '#d0a870',
  'rail', '#e8c860',
  '#6a5a8e',
];

/** Core stroke width by tier; the glow multiplies this. */
const TIER_WIDTH: ExpressionSpecification = [
  'match',
  ['get', 'tier'],
  'path', 1,
  'track', 2,
  'road', 3.5,
  'avenue', 5.5,
  'rail', 8,
  1,
];

function toGeoJson(edges: readonly WalkedEdge[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: edges.map((e) => ({
      type: 'Feature',
      properties: { tier: e.tier },
      geometry: {
        type: 'LineString',
        coordinates: [
          [e.a.lng, e.a.lat],
          [e.b.lng, e.b.lat],
        ],
      },
    })),
  };
}

/** Idempotent: safe on every render, does nothing once the layers exist. */
export function ensurePathLayers(map: MapLibreMap): void {
  if (map.getSource(PATH_SOURCE)) return;

  map.addSource(PATH_SOURCE, { type: 'geojson', data: toGeoJson([]), generateId: false });

  map.addLayer({
    id: PATH_GLOW_LAYER,
    type: 'line',
    source: PATH_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': TIER_COLOR,
      'line-width': ['*', TIER_WIDTH, 2.4],
      'line-blur': 4,
      'line-opacity': 0.3,
    },
  });

  map.addLayer({
    id: PATH_CORE_LAYER,
    type: 'line',
    source: PATH_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': TIER_COLOR,
      'line-width': TIER_WIDTH,
      'line-opacity': 0.75,
    },
  });
}

export function setPathData(map: MapLibreMap, edges: readonly WalkedEdge[]): void {
  const source = map.getSource(PATH_SOURCE);
  (source as { setData?: (d: FeatureCollection) => void })?.setData?.(toGeoJson(edges));
}

export function removePathLayers(map: MapLibreMap): void {
  for (const id of [PATH_CORE_LAYER, PATH_GLOW_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(PATH_SOURCE)) map.removeSource(PATH_SOURCE);
}
