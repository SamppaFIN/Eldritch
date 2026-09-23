/**
 * The Atlas: one res-5 hex per municipality with any player's ground in it
 * (BRDC-ATLAS-001).
 *
 * Below `NATION_MAXZOOM`, where `cells-fill` hands off — a country zoomed out to fit a
 * phone screen has hundreds of scattered res-11 hexes a few pixels each, which is
 * dust, not the "city borders" the RED asks for. One filled hex per municipality
 * instead, coloured the same two-tier way the close-up view already is: yours in
 * `--cosmic-purple`, anyone else's the one fixed rival red — §13's own rule against a
 * hue per player holds just as well a hundred kilometres up as it does on foot.
 *
 * Split from `TerritoryLayer.ts` the same way `territoryMarks.ts`/`territoryImages.ts`
 * already are: a different concern, a different reason to change.
 */
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellBoundary } from '@es3/core';
import type { AtlasRegion, PlayerId } from '@es3/core';
import { ENEMY_FILL, ENEMY_STROKE, OWN_FILL, OWN_STROKE } from './territoryFeatures.js';
import { fadeAcrossBand, NATION_FADE_END, NATION_FILL_LAYER, NATION_LINE_LAYER, NATION_SOURCE } from './layerIds.js';

export interface NationProperties {
  mine: boolean;
  color: string;
  /** The dominant holder's nation name, falling back to their own name — never the
   *  player id, which is a shape, not a word (Sigil §01's own rule for the Codex). */
  name: string;
  players: number;
  areaM2: number;
}

function nationFeature(region: AtlasRegion, me: PlayerId | null): Feature<Polygon, NationProperties> {
  const mine = region.dominant.id === me;
  return {
    type: 'Feature',
    id: region.region,
    properties: {
      mine,
      color: mine ? OWN_FILL : ENEMY_FILL,
      name: region.dominant.nation ?? region.dominant.name,
      players: region.players,
      areaM2: region.areaM2,
    },
    geometry: { type: 'Polygon', coordinates: [cellBoundary(region.region)] },
  };
}

export function nationRegionsToGeoJson(
  regions: readonly AtlasRegion[],
  me: PlayerId | null,
): FeatureCollection<Polygon, NationProperties> {
  return { type: 'FeatureCollection', features: regions.map((r) => nationFeature(r, me)) };
}

/** Idempotent, like `ensureTerritoryLayers` beside it. */
export function addNationLayers(map: MapLibreMap): void {
  if (map.getSource(NATION_SOURCE)) return;
  map.addSource(NATION_SOURCE, { type: 'geojson', data: nationRegionsToGeoJson([], null) });

  map.addLayer({
    id: NATION_FILL_LAYER,
    type: 'fill',
    source: NATION_SOURCE,
    maxzoom: NATION_FADE_END,
    paint: {
      'fill-color': ['get', 'color'],
      // Same two figures the close-up fill uses for mine/theirs (REVEAL_FILL has no
      // equivalent here — a municipality with nobody's ground in it is not a feature
      // at all, so there is no third tier to draw), fading to 0 across the band where
      // the ordinary cell layers take over.
      'fill-opacity': fadeAcrossBand(['case', ['get', 'mine'], 0.32, 0.22], 0),
    },
  });

  map.addLayer({
    id: NATION_LINE_LAYER,
    type: 'line',
    source: NATION_SOURCE,
    maxzoom: NATION_FADE_END,
    paint: {
      'line-color': ['case', ['get', 'mine'], OWN_STROKE, ENEMY_STROKE],
      'line-width': 1,
      'line-opacity': fadeAcrossBand(0.7, 0),
    },
  });
}

export function setNationData(map: MapLibreMap, regions: readonly AtlasRegion[], me: PlayerId | null): void {
  const source = map.getSource(NATION_SOURCE);
  (source as { setData?: (d: FeatureCollection<Polygon, NationProperties>) => void })?.setData?.(
    nationRegionsToGeoJson(regions, me),
  );
}
