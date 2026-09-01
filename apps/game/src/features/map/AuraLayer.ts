/**
 * The influence overlay (BRDC-BUILD-004, closing BRDC-INSPECT-001's complaint).
 *
 * Area effects — a Library's wisdom, a Fortress's defence, the loyalty a Monument or a
 * temple lends — reach past the cell they sit on, and until now nothing on the map said
 * how far. When a cell with an aura is selected, this outlines the hexes it touches: one
 * GeoJSON source, a filled wash and a bright edge, redrawn wholesale like the trail.
 */
import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellBoundary } from '@es3/core';

export const AURA_SOURCE = 'aura';
export const AURA_FILL_LAYER = 'aura-fill';
export const AURA_EDGE_LAYER = 'aura-edge';

// --sacred-gold, the colour the game already uses for a claim burst and a temple.
const AURA = '#ffd700';

function toGeoJson(cells: readonly string[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: cells.map((h3) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [cellBoundary(h3)] },
    })),
  };
}

/** Idempotent: safe on every render, does nothing once the layers exist. */
export function ensureAuraLayers(map: MapLibreMap): void {
  if (map.getSource(AURA_SOURCE)) return;

  map.addSource(AURA_SOURCE, { type: 'geojson', data: toGeoJson([]), generateId: false });

  map.addLayer({
    id: AURA_FILL_LAYER,
    type: 'fill',
    source: AURA_SOURCE,
    paint: { 'fill-color': AURA, 'fill-opacity': 0.08 },
  });

  map.addLayer({
    id: AURA_EDGE_LAYER,
    type: 'line',
    source: AURA_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': AURA, 'line-width': 1.5, 'line-opacity': 0.5, 'line-dasharray': [2, 2] },
  });
}

export function setAuraData(map: MapLibreMap, cells: readonly string[]): void {
  const source = map.getSource(AURA_SOURCE);
  (source as { setData?: (d: FeatureCollection) => void })?.setData?.(toGeoJson(cells));
}

export function removeAuraLayers(map: MapLibreMap): void {
  for (const id of [AURA_EDGE_LAYER, AURA_FILL_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(AURA_SOURCE)) map.removeSource(AURA_SOURCE);
}
