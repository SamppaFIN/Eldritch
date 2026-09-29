/**
 * The isometric Work icons on the map (BRDC-ART-003) — MapLibre plumbing only.
 *
 * Its own source and layer, apart from the hex polygons: one point per Work
 * (`buildingIconFeatures`), placed with a small per-slot fan so a cluster of three does
 * not stack into one blob. Toggleable from the menu — the map's first real filter.
 *
 * The decision of which sprite, which slot, whose cell all lives in
 * `buildingIconFeatures.ts` and `buildingSprites.ts`, where it is tested.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Cell } from '@es3/core';
import { CELL_BUILDING_LAYER } from './TerritoryLayer.js';
import { buildingIconFeatures } from './buildingIconFeatures.js';
import type { BuildingIconProps } from './buildingIconFeatures.js';
import { SPRITE_PX, spriteId, spriteSvg } from './buildingSprites.js';
import { DESIGN_SPRITES } from './designSprites.js';
import { rasteriseSvgs } from './spriteRaster.js';
import { watchRemoval } from '../map/mapLife.js';
import { BUILDING_ROLE } from './buildingGlyphs.js';
import type { BuildingId } from '@es3/core';
import { keyed, syncSource } from './territorySync.js';

export const WORK_ICON_SOURCE = 'work-icons';
export const WORK_PLINTH_LAYER = 'work-plinth';
export const WORK_ICON_LAYER = 'work-icons-symbol';

const EMPTY: FeatureCollection<Point, BuildingIconProps> = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * Draw a Work's sprite the first time the map asks for it (BRDC-ART-006).
 *
 * Every sprite used to be rasterised at map open, one after another, before any of them
 * could be seen — seconds of main thread on a phone (BRDC-MOBILE-004) for sixteen
 * buildings most realms never build. Now MapLibre says which image it is missing and only
 * that one is drawn, once; the tiles that wanted it pick it up when it lands.
 */
const asked = new WeakMap<MapLibreMap, Set<string>>();
function drawOnDemand(map: MapLibreMap): void {
  if (asked.has(map)) return;
  const pending = new Set<string>();
  asked.set(map, pending);
  map.on('styleimagemissing', (e: { id: string }) => {
    const id = e.id;
    const work = id.slice('work-'.length) as BuildingId;
    if (!id.startsWith('work-') || !(work in BUILDING_ROLE) || pending.has(id) || map.hasImage(id)) return;
    pending.add(id);
    const life = watchRemoval(map);
    void rasteriseSvgs([work], spriteSvg, spriteId, SPRITE_PX).then((images) => {
      life.stop();
      pending.delete(id);
      if (!images || life.gone()) return;
      for (const [key, data] of images) if (!map.hasImage(key)) map.addImage(key, data, { pixelRatio: 2 });
    });
  });
}

/**
 * Add the source and layer, once. `visible` is the stored toggle; the layer starts
 * hidden when it is off so the first paint is already correct.
 */
export function ensureBuildingIconLayer(map: MapLibreMap, visible: boolean): void {
  drawOnDemand(map);
  if (map.getSource(WORK_ICON_SOURCE)) {
    setBuildingIconsVisible(map, visible);
    return;
  }
  map.addSource(WORK_ICON_SOURCE, { type: 'geojson', data: EMPTY, promoteId: 'h3' });
  /*
   * The plinth (Sigil §03).
   *
   * "Terrain never fills the hex; it tints the iso plinth under whatever stands there."
   * Since the terrain tiles came off the hex, this is where the ground shows: a disc under
   * the structure, in the hue of what that terrain yields, so a Sawmill reads as standing
   * on forest rather than floating on a tinted polygon.
   *
   * A disc rather than the document's 2:1 diamond — MapLibre cannot rotate a circle, and a
   * diamond would mean one more sprite per terrain per building. At this size it reads as
   * the ground the thing stands on, which is the job.
   */
  map.addLayer({
    id: WORK_PLINTH_LAYER,
    type: 'circle',
    source: WORK_ICON_SOURCE,
    minzoom: 15,
    // A Codex drawing stands on its own plinth (BRDC-ART-006); the disc is for the rest.
    filter: ['!', ['in', ['get', 'sprite'], ['literal', Object.keys(DESIGN_SPRITES).map((id) => spriteId(id as BuildingId))]]],
    layout: { visibility: visible ? 'visible' : 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 5, 19, 17],
      'circle-color': [
        'match',
        ['get', 'ground'],
        'forest', '#5fae6a',
        'hill', '#a8b2c4',
        'mountain', '#a9cbdb',
        'lake', '#6fdc8c',
        'coast', '#6fdc8c',
        'market', '#ffd700',
        '#7a7386',
      ],
      'circle-opacity': 0.34,
      'circle-blur': 0.35,
      'circle-translate': [0, 4],
    },
  });

  map.addLayer({
    id: WORK_ICON_LAYER,
    type: 'symbol',
    source: WORK_ICON_SOURCE,
    // With its plinth: an iso sprite a few pixels high is cost, not a building (BRDC-PERF-004).
    minzoom: 15,
    layout: {
      visibility: visible ? 'visible' : 'none',
      'icon-image': ['get', 'sprite'],
      /*
       * The structure is the hex's one object (Sigil §03: "One object per cell,
       * bottom-anchored on the hex centre"), so it is sized against the hex, not by eye:
       * about 55% of its width. Registered at pixelRatio 2, so on screen it is
       * SPRITE_PX × size ÷ 2 — 96 × size. The hex is 87 / 174 / 348 px wide at zoom
       * 16 / 17 / 18 (measured, see `cellMarks.ts`), giving 48 / 96 / 192 px.
       *
       * Exponential, base 2, because the hex doubles every zoom. Capped at 2.0 — twice the
       * raster's native size — so zoom 19 grows the hex around a crisp building instead of
       * blowing the building up into blur. The old ramp ignored the ÷ 2 and drew a Work at
       * 6% of the hex at zoom 19, which is the "much bigger" in the field report.
       */
      'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 13, 0.0625, 16, 0.5, 17, 1, 18, 2],
      'icon-anchor': 'bottom',
      // Fan the cluster: one Work centres, two split, three spread. Units are ems of the
      // icon, so this scales with `icon-size`.
      'icon-offset': [
        'case',
        ['==', ['get', 'count'], 1],
        ['literal', [0, 0]],
        ['==', ['get', 'slot'], 0],
        ['literal', [-28, 0]],
        ['==', ['get', 'slot'], 1],
        ['literal', [28, 0]],
        ['literal', [0, -36]],
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: {
      // A rival's Work is dimmed, not recoloured — the sprite already carries its role.
      // Hidden where `useFocusFloat` draws the same building floating (BRDC-FX-003).
      'icon-opacity': ['case', ['boolean', ['feature-state', 'focus'], false], 0, ['get', 'mine'], 1, 0.7],
    },
  });
}

export function setBuildingIconData(
  map: MapLibreMap,
  cells: readonly Cell[],
  me: string | null,
): void {
  syncSource(map, WORK_ICON_SOURCE, keyed(buildingIconFeatures(cells, me)));
}

/**
 * Show the icons or fall back to the single role glyph.
 *
 * The two are mutually exclusive: icons on hides `cells-building` (ART-002's one mark),
 * icons off brings it back, so the toggle is "detailed / plain", never "double marked".
 */
export function setBuildingIconsVisible(map: MapLibreMap, visible: boolean): void {
  if (map.getLayer(WORK_PLINTH_LAYER)) {
    map.setLayoutProperty(WORK_PLINTH_LAYER, 'visibility', visible ? 'visible' : 'none');
  }
  if (map.getLayer(WORK_ICON_LAYER)) {
    map.setLayoutProperty(WORK_ICON_LAYER, 'visibility', visible ? 'visible' : 'none');
  }
  if (map.getLayer(CELL_BUILDING_LAYER)) {
    map.setLayoutProperty(CELL_BUILDING_LAYER, 'visibility', visible ? 'none' : 'visible');
  }
}

export function removeBuildingIconLayer(map: MapLibreMap): void {
  // Both layers before the source they share — MapLibre refuses to drop a source that
  // still has a layer on it, and the plinth is the newer of the two.
  if (map.getLayer(WORK_ICON_LAYER)) map.removeLayer(WORK_ICON_LAYER);
  if (map.getLayer(WORK_PLINTH_LAYER)) map.removeLayer(WORK_PLINTH_LAYER);
  if (map.getSource(WORK_ICON_SOURCE)) map.removeSource(WORK_ICON_SOURCE);
}

export { SPRITE_PX };
