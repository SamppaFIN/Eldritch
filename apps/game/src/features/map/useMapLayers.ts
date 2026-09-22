/**
 * Registers and tears down every GeoJSON layer the map draws on — split out of
 * `MapCanvas.tsx` when it reached its 400-line ceiling (BRDC-ATLAS-001's own addition
 * was the one that finally tipped it). This is pure MapLibre bookkeeping, no data: one
 * effect, one job, own file.
 *
 * Order is z-order: territory at the bottom, then the worn paths, then the live
 * ley-line the player is drawing now, then auras, places, the Keep, quest sigils, and
 * the two-second awakening flash on top.
 */
import { useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { ensureAuraLayers, removeAuraLayers } from './AuraLayer.js';
import { ensureAwakeningLayers, removeAwakeningLayers } from '../territory/AwakeningLayer.js';
import { ensureCastleLayer, removeCastleLayer } from '../territory/CastleMarker.js';
import { ensurePathLayers, removePathLayers } from '../trail/PathLayer.js';
import { ensurePlaceLayers, removePlaceLayers } from '../territory/PlaceMarkers.js';
import { ensureQuestLayers, removeQuestLayers } from '../territory/QuestMarkers.js';
import { ensureArcLayer } from '../territory/strengthArcs.js';
import { CELL_GROUND_LAYER, ensureTerritoryLayers, removeTerritoryLayers } from '../territory/TerritoryLayer.js';
import { ensureTradeLayer, removeTradeLayer } from './TradeLayer.js';
import { ensureTrailLayers, removeTrailLayers } from '../trail/TrailLayer.js';

export function useMapLayers(map: MapLibreMap | null, ready: boolean): void {
  useEffect(() => {
    if (!map || !ready) return;
    ensureTerritoryLayers(map);
    // The strength arc rides under the marks, so a temple's nimbus is never behind it.
    ensureArcLayer(map, CELL_GROUND_LAYER);
    ensurePathLayers(map);
    ensureAuraLayers(map);
    ensureTradeLayer(map);
    ensureTrailLayers(map);
    ensurePlaceLayers(map);
    ensureCastleLayer(map);
    ensureQuestLayers(map);
    ensureAwakeningLayers(map);
    return () => {
      // Guard: React may run cleanup after the map has already been torn down.
      if (map.loaded()) {
        removeAwakeningLayers(map);
        removeQuestLayers(map);
        removeCastleLayer(map);
        removePlaceLayers(map);
        removeTrailLayers(map);
        removeTradeLayer(map);
        removeAuraLayers(map);
        removePathLayers(map);
        removeTerritoryLayers(map);
      }
    };
  }, [map, ready]);
}
