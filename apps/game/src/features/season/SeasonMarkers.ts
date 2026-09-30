/**
 * Open gates and found wonders on the map (field report 2026-09-30). One source, one
 * structure layer and one name, drawn the way `PlaceMarkers.ts` draws a Temple: the
 * structure stands on the hex centre and grows with it, the name sits above it.
 */
import { useEffect, useState } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre } from '@es3/core';
import type { GameRepository, H3Index } from '@es3/core';
import { beneathMarks, slotTranslate } from '../territory/cellMarks.js';
import { watchRemoval } from '../map/mapLife.js';
import { SEASON_MARK_KINDS, rasteriseSeasonMarks, seasonSpriteId } from './seasonSprites.js';
import type { SeasonMarkKind } from './seasonSprites.js';

export interface SeasonMark {
  h3: H3Index;
  kind: SeasonMarkKind;
  label: string;
}

const SOURCE = 'season-marks';
const SPRITE_LAYER = 'season-marks-sprite';
const LABEL_LAYER = 'season-marks-label';
const COLOUR: Readonly<Record<SeasonMarkKind, string>> = { gate: '#00d4ff', wonder: '#ffd700' };

function toGeoJson(marks: readonly SeasonMark[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: marks.map((m) => {
      const { lat, lng } = cellCentre(m.h3);
      return {
        type: 'Feature',
        properties: { kind: m.kind, label: m.label.toUpperCase(), color: COLOUR[m.kind] },
        geometry: { type: 'Point', coordinates: [lng, lat] },
      };
    }),
  };
}

export function ensureSeasonMarkLayers(map: MapLibreMap): void {
  if (map.getSource(SOURCE)) return;
  map.addSource(SOURCE, { type: 'geojson', data: toGeoJson([]) });
  map.addLayer({
    id: SPRITE_LAYER,
    type: 'symbol',
    source: SOURCE,
    minzoom: 13,
    layout: {
      'icon-image': ['concat', 'season-', ['get', 'kind']],
      // The Temple's own curve (`PlaceMarkers.ts`), so a gate stands as tall as a Work.
      'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 13, 0.0625, 16, 0.5, 17, 1, 18, 2],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });
  map.addLayer({
    id: LABEL_LAYER,
    type: 'symbol',
    source: SOURCE,
    minzoom: 14,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-letter-spacing': 0.16,
      'text-anchor': 'bottom',
      'text-allow-overlap': false,
    },
    paint: {
      'text-translate': slotTranslate('north'),
      'text-color': ['get', 'color'],
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
    },
  }, beneathMarks(map));
  void addSprites(map);
}

async function addSprites(map: MapLibreMap): Promise<void> {
  if (SEASON_MARK_KINDS.every((k) => map.hasImage(seasonSpriteId(k)))) return;
  const life = watchRemoval(map);
  const images = await rasteriseSeasonMarks();
  life.stop();
  if (!images || life.gone()) return;
  for (const [id, data] of images) if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
}

export function setSeasonMarkData(map: MapLibreMap, marks: readonly SeasonMark[]): void {
  const source = map.getSource(SOURCE);
  (source as { setData?: (d: FeatureCollection<Point>) => void })?.setData?.(toGeoJson(marks));
}

export function removeSeasonMarkLayers(map: MapLibreMap): void {
  for (const id of [LABEL_LAYER, SPRITE_LAYER]) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(SOURCE)) map.removeSource(SOURCE);
}

/** Open gates and found wonders, re-read each game minute. Empty on a Season 1 save. */
export function useSeasonMarks(repository: GameRepository | null, now: number): SeasonMark[] {
  const [marks, setMarks] = useState<SeasonMark[]>([]);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void (async () => {
      const gates = (await repository.gates.view(now))?.gates ?? [];
      const wonders = await repository.wonderActs.finds();
      if (!live) return;
      setMarks([
        ...gates.map((g) => ({ h3: g.h3, kind: 'gate' as const, label: 'Open gate' })),
        ...wonders.map((w) => ({ h3: w.h3, kind: 'wonder' as const, label: w.name })),
      ]);
    })();
    return () => {
      live = false;
    };
  }, [repository, now]);
  return marks;
}
