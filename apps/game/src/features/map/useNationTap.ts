/**
 * Tapping a municipality on the Atlas flies out to it — a glance at a neighbour nation
 * rather than a walk there (BRDC-ATLAS-001). `unfollow` first, or the next GPS fix would
 * drag the camera straight back home mid-flight.
 *
 * The target comes from where the tap landed, not the tapped feature's own id: a
 * GeoJSON source's string id does not survive MapLibre's vector-tile encoding intact, so
 * `e.features[0].id` hands back a silently truncated number here — the same limitation
 * `cellAt(e.lngLat)` already works around for an ordinary hex tap in `MapCanvas.tsx`.
 */
import { useEffect } from 'react';
import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import { cellCentre, nationRegionAt } from '@es3/core';
import { NATION_FILL_LAYER, NATION_FLY_ZOOM } from '../territory/layerIds.js';

export function useNationTap(map: MapLibreMap | null, ready: boolean, unfollow: () => void): void {
  useEffect(() => {
    if (!map || !ready) return;
    const onClick = (e: MapLayerMouseEvent) => {
      if (!e.features?.length) return;
      unfollow();
      const region = nationRegionAt({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      const centre = cellCentre(region);
      map.flyTo({ center: [centre.lng, centre.lat], zoom: NATION_FLY_ZOOM, essential: true });
    };
    const enter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
    };
    map.on('click', [NATION_FILL_LAYER], onClick);
    map.on('mouseenter', [NATION_FILL_LAYER], enter);
    map.on('mouseleave', [NATION_FILL_LAYER], leave);
    return () => {
      map.off('click', [NATION_FILL_LAYER], onClick);
      map.off('mouseenter', [NATION_FILL_LAYER], enter);
      map.off('mouseleave', [NATION_FILL_LAYER], leave);
    };
  }, [map, ready, unfollow]);
}
