/**
 * The Work-icon layer's lifecycle, lifted out of MapCanvas (BRDC-ART-003).
 *
 * MapCanvas was at its line limit and this is a self-contained concern: add the layer
 * once the map is ready, feed it the visible cells, toggle it with the setting, tear it
 * down on unmount. The plumbing it drives is in `BuildingIconLayer.ts`.
 */
import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Cell, PlayerId } from '@es3/core';
import {
  ensureBuildingIconLayer,
  removeBuildingIconLayer,
  setBuildingIconData,
  setBuildingIconsVisible,
} from '../territory/BuildingIconLayer.js';

export function useBuildingIcons(
  map: MapLibreMap | null,
  ready: boolean,
  cells: readonly Cell[] | undefined,
  playerId: PlayerId | null,
  on: boolean,
): void {
  const onRef = useRef(on);
  onRef.current = on;

  useEffect(() => {
    if (!map || !ready) return;
    ensureBuildingIconLayer(map, onRef.current);
    return () => {
      if (map.loaded()) removeBuildingIconLayer(map);
    };
  }, [map, ready]);

  useEffect(() => {
    if (!map || !ready || !cells) return;
    setBuildingIconData(map, cells, playerId);
  }, [map, ready, cells, playerId]);

  useEffect(() => {
    if (!map || !ready) return;
    setBuildingIconsVisible(map, on);
  }, [map, ready, on]);
}
