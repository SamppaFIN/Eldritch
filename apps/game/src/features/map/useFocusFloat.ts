/**
 * The building underfoot floats (BRDC-FX-003).
 *
 * Infinite 2026-09-28: bob only the focus cell. One DOM marker carrying the building's
 * own sprite, animated with a transform alone — the compositor moves it without the map
 * repainting. The same building is hidden on the symbol layer with feature-state (not a
 * filter, which would re-lay-out tiles), so it is never drawn twice.
 */
import { useEffect } from 'react';
import { Marker } from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellAt, cellCentreLngLat, worksOn } from '@es3/core';
import type { Cell, LatLng } from '@es3/core';
import { spriteSvg } from '../territory/buildingSprites.js';
import { WORK_ICON_SOURCE } from '../territory/BuildingIconLayer.js';
import './focus-float.css';

/** The sprite's height on screen at a zoom — the icon layer's own ramp, 48 px at 16. */
export function floatPx(zoom: number): number {
  return Math.round(Math.min(192, Math.max(24, 48 * 2 ** (zoom - 16))));
}

export function useFocusFloat(
  map: MapLibreMap | null,
  ready: boolean,
  position: LatLng | null,
  cells: readonly Cell[] | null,
): void {
  const h3 = position ? cellAt(position) : null;
  const cell = h3 ? (cells?.find((c) => c.h3 === h3) ?? null) : null;
  const works = cell ? worksOn(cell) : [];
  const work = works[works.length - 1] ?? null;
  const slot = works.length - 1;

  useEffect(() => {
    if (!map || !ready || !h3 || !work || !map.getSource(WORK_ICON_SOURCE)) return;
    const img = document.createElement('img');
    img.className = 'focus-float';
    img.alt = '';
    img.src = `data:image/svg+xml,${encodeURIComponent(spriteSvg(work.id))}`;
    const size = () => {
      const px = floatPx(map.getZoom());
      img.width = px;
      img.height = px;
    };
    size();
    const [lng, lat] = cellCentreLngLat(h3);
    const marker = new Marker({ element: img, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);
    const id = { source: WORK_ICON_SOURCE, id: `${h3}#${slot}` };
    map.setFeatureState(id, { focus: true });
    map.on('zoom', size);
    return () => {
      map.off('zoom', size);
      marker.remove();
      if (map.getSource(WORK_ICON_SOURCE)) map.removeFeatureState(id, 'focus');
    };
  }, [map, ready, h3, work?.id, slot]);
}
