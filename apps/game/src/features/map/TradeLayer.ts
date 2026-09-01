/**
 * Trade Routes on the map (BRDC-BUILD-004).
 *
 * A route is the one building bound to two cells, so it draws as a line between their
 * centres rather than a marker on one. One GeoJSON source, a single gold line layer,
 * redrawn wholesale like the trail.
 */
import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre } from '@es3/core';
import type { TradeRoute } from '@es3/core';

export const TRADE_SOURCE = 'trade-routes';
export const TRADE_LINE_LAYER = 'trade-line';

// --sacred-gold, dashed, so it reads as a route rather than a border.
const GOLD = '#e0b04a';

function toGeoJson(routes: readonly TradeRoute[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes.map((r) => {
      const a = cellCentre(r.a);
      const b = cellCentre(r.b);
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [a.lng, a.lat],
            [b.lng, b.lat],
          ],
        },
      };
    }),
  };
}

/** Idempotent: safe on every render, does nothing once the layer exists. */
export function ensureTradeLayer(map: MapLibreMap): void {
  if (map.getSource(TRADE_SOURCE)) return;

  map.addSource(TRADE_SOURCE, { type: 'geojson', data: toGeoJson([]), generateId: false });

  map.addLayer({
    id: TRADE_LINE_LAYER,
    type: 'line',
    source: TRADE_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': GOLD,
      'line-width': 2,
      'line-opacity': 0.7,
      'line-dasharray': [3, 2],
    },
  });
}

export function setTradeData(map: MapLibreMap, routes: readonly TradeRoute[]): void {
  const source = map.getSource(TRADE_SOURCE);
  (source as { setData?: (d: FeatureCollection) => void })?.setData?.(toGeoJson(routes));
}

export function removeTradeLayer(map: MapLibreMap): void {
  if (map.getLayer(TRADE_LINE_LAYER)) map.removeLayer(TRADE_LINE_LAYER);
  if (map.getSource(TRADE_SOURCE)) map.removeSource(TRADE_SOURCE);
}
