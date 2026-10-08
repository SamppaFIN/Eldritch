/**
 * Trade routes on the map (BRDC-TRADEROUTE-001): a thin gold line from Market to Market,
 * or to a village's door. A route whose end was lost is drawn faint and broken, so the
 * walk to win it back is still on the map.
 */
import { useEffect, useState } from 'react';
import type { FeatureCollection, LineString } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre } from '@es3/core';
import type { Cell, GameRepository, RouteRow } from '@es3/core';
import { beneathMarks } from './cellMarks.js';

const SOURCE = 'trade-routes';
const LAYER = 'trade-routes-line';
// Hex, not a token: MapLibre paint does not resolve `var()`. --sacred-gold.
const GOLD = '#ffd700';

function toGeoJson(routes: readonly RouteRow[]): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: routes.map((r) => {
      const a = cellCentre(r.a);
      const b = cellCentre(r.b);
      return { type: 'Feature', properties: { active: r.active }, geometry: { type: 'LineString', coordinates: [[a.lng, a.lat], [b.lng, b.lat]] } };
    }),
  };
}

export function ensureRouteLayer(map: MapLibreMap): void {
  if (map.getSource(SOURCE)) return;
  map.addSource(SOURCE, { type: 'geojson', data: toGeoJson([]) });
  map.addLayer({
    id: LAYER,
    type: 'line',
    source: SOURCE,
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': GOLD,
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 17, 3],
      'line-opacity': ['case', ['get', 'active'], 0.85, 0.3],
      'line-dasharray': ['case', ['get', 'active'], ['literal', [1, 0]], ['literal', [2, 2]]],
    },
  }, beneathMarks(map));
}

export function setRouteData(map: MapLibreMap, routes: readonly RouteRow[]): void {
  (map.getSource(SOURCE) as { setData?: (d: FeatureCollection<LineString>) => void } | undefined)?.setData?.(toGeoJson(routes));
}

export function removeRouteLayer(map: MapLibreMap): void {
  if (map.getLayer(LAYER)) map.removeLayer(LAYER);
  if (map.getSource(SOURCE)) map.removeSource(SOURCE);
}

/** Every route walked this season, re-read whenever the ground changes. */
export function useTradeRoutes(repository: GameRepository | null, now: number, cells: readonly Cell[] | undefined): RouteRow[] {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.routes.view(now).then((r) => live && setRoutes(r));
    return () => {
      live = false;
    };
  }, [repository, now, cells]);
  return routes;
}
