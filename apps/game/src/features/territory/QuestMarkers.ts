/**
 * Adventure landmarks on the map (BRDC-QUEST-001).
 *
 * The Fuming Lake reveals its path one stop at a time: the statue from the start, then
 * the lake, the hermit, the bridge, the deep — each as the story reaches the stage
 * before it. The three ways past the troll are never drawn here; they are found by
 * walking onto the cell, and only then added to the set. The caller decides which ids
 * are visible (`visibleQuestSites` in core); this just draws them.
 *
 * A gold sigil and a name, on the same layers as the place markers.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { QUEST_SITES, cellCentre, siteCell } from '@es3/core';
import type { QuestSiteId } from '@es3/core';
import { beneathMarks, slotTranslate } from './cellMarks.js';

export const QUEST_SOURCE = 'quest-sites';
export const QUEST_HALO_LAYER = 'quest-sites-halo';
export const QUEST_MARK_LAYER = 'quest-sites-mark';
export const QUEST_LABEL_LAYER = 'quest-sites-label';

const GOLD = '#ffd700'; // --sacred-gold

export function questSitesToGeoJson(ids: readonly string[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: ids
      .filter((id): id is QuestSiteId => id in QUEST_SITES)
      .map((id) => {
        // The label is the authored table; the position is the centre of the hex the tale
        // is pinned to. It used to be `questSiteAt`, worked out from the Keep afresh on every
        // read — so after the v0.6.13 pin the rules stayed on the pinned hex while this marker
        // still slid whenever the Hearth moved, and a tap opened a hex it was no longer drawn
        // on (BRDC-SIGIL-006).
        const at = cellCentre(siteCell(id));
        return {
          type: 'Feature',
          id,
          properties: { label: QUEST_SITES[id].label.toUpperCase() },
          geometry: { type: 'Point', coordinates: [at.lng, at.lat] },
        };
      }),
  };
}

export function ensureQuestLayers(map: MapLibreMap): void {
  if (map.getSource(QUEST_SOURCE)) return;

  map.addSource(QUEST_SOURCE, { type: 'geojson', data: questSitesToGeoJson([]) });

  map.addLayer({
    id: QUEST_HALO_LAYER,
    type: 'circle',
    source: QUEST_SOURCE,
    paint: {
      'circle-color': GOLD,
      'circle-opacity': 0.14,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 8, 16, 22, 19, 38],
      'circle-blur': 0.8,
    },
  });

  map.addLayer({
    id: QUEST_MARK_LAYER,
    type: 'symbol',
    source: QUEST_SOURCE,
    layout: {
      'text-field': '✦',
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 14, 18, 22],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': GOLD,
      'text-halo-color': '#0a0612',
      'text-halo-width': 1.8,
    },
  });

  map.addLayer({
    id: QUEST_LABEL_LAYER,
    type: 'symbol',
    source: QUEST_SOURCE,
    minzoom: 14,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 10,
      'text-letter-spacing': 0.16,
      'text-anchor': 'bottom',
      'text-allow-overlap': false,
    },
    paint: {
      // The north slot, beneath the numbers, like every other name on a hex (BRDC-SIGIL-006).
      'text-translate': slotTranslate('north'),
      'text-color': GOLD,
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
      'text-opacity': 0.85,
    },
  }, beneathMarks(map));
}

export function setQuestData(map: MapLibreMap, ids: readonly string[]): void {
  const source = map.getSource(QUEST_SOURCE);
  (source as { setData?: (d: FeatureCollection<Point>) => void })?.setData?.(questSitesToGeoJson(ids));
}

export function removeQuestLayers(map: MapLibreMap): void {
  for (const id of [QUEST_LABEL_LAYER, QUEST_MARK_LAYER, QUEST_HALO_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(QUEST_SOURCE)) map.removeSource(QUEST_SOURCE);
}
