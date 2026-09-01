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
import { QUEST_SITES } from '@es3/core';
import type { QuestSiteId } from '@es3/core';

export const QUEST_SOURCE = 'quest-sites';
export const QUEST_HALO_LAYER = 'quest-sites-halo';
export const QUEST_MARK_LAYER = 'quest-sites-mark';
export const QUEST_LABEL_LAYER = 'quest-sites-label';

const GOLD = '#ffd700'; // --sacred-gold

function toGeoJson(ids: readonly string[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: ids
      .filter((id): id is QuestSiteId => id in QUEST_SITES)
      .map((id) => {
        const site = QUEST_SITES[id];
        return {
          type: 'Feature',
          id,
          properties: { label: site.label.toUpperCase() },
          geometry: { type: 'Point', coordinates: [site.lng, site.lat] },
        };
      }),
  };
}

export function ensureQuestLayers(map: MapLibreMap): void {
  if (map.getSource(QUEST_SOURCE)) return;

  map.addSource(QUEST_SOURCE, { type: 'geojson', data: toGeoJson([]) });

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
      'text-offset': [0, 1.4],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': GOLD,
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
      'text-opacity': 0.85,
    },
  });
}

export function setQuestData(map: MapLibreMap, ids: readonly string[]): void {
  const source = map.getSource(QUEST_SOURCE);
  (source as { setData?: (d: FeatureCollection<Point>) => void })?.setData?.(toGeoJson(ids));
}

export function removeQuestLayers(map: MapLibreMap): void {
  for (const id of [QUEST_LABEL_LAYER, QUEST_MARK_LAYER, QUEST_HALO_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(QUEST_SOURCE)) map.removeSource(QUEST_SOURCE);
}
