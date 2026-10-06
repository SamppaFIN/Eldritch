/**
 * The Medium's anomalies beyond your border (BRDC-INVEST-001): the same ◌ an untouched one
 * wears on your own ground, on the hexes one ring out. Fed from the repository by
 * `useMapExtras`, so the territory layer's feature builder stays blind to who you are.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre } from '@es3/core';
import type { H3Index } from '@es3/core';
import { CELL_DETAIL_MINZOOM } from './layerIds.js';

const SOURCE = 'anomalies-afar';
const LAYER = 'anomalies-afar';

export function afarFeatures(h3s: readonly H3Index[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: h3s.map((h3) => {
      const { lat, lng } = cellCentre(h3);
      return { type: 'Feature', properties: { h3 }, geometry: { type: 'Point', coordinates: [lng, lat] } };
    }),
  };
}

export function ensureAfarAnomalyLayer(map: MapLibreMap): void {
  if (map.getSource(SOURCE)) return;
  map.addSource(SOURCE, { type: 'geojson', data: afarFeatures([]) });
  map.addLayer({
    id: LAYER,
    type: 'symbol',
    source: SOURCE,
    minzoom: CELL_DETAIL_MINZOOM,
    layout: {
      'text-field': '◌',
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 17, 17, 19, 22],
      'text-offset': [0, -1.1],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: { 'text-color': '#00d4ff', 'text-opacity': 0.7, 'text-halo-color': '#0a0612', 'text-halo-width': 2 },
  });
}

export function setAfarAnomalyData(map: MapLibreMap, h3s: readonly H3Index[]): void {
  (map.getSource(SOURCE) as { setData?: (d: FeatureCollection<Point>) => void } | undefined)?.setData?.(afarFeatures(h3s));
}

export function removeAfarAnomalyLayer(map: MapLibreMap): void {
  if (map.getLayer(LAYER)) map.removeLayer(LAYER);
  if (map.getSource(SOURCE)) map.removeSource(SOURCE);
}
