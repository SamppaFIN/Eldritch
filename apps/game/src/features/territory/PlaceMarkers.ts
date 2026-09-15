/**
 * Anchor Stone and Temples on the map.
 *
 * These are the cells the game worked out on its own, so they are drawn differently
 * from ground: a structure standing on the hex rather than a tint (`placeSprites.ts`),
 * with a glow and a name. claude.md §12 names the shape for an Anchor — a Platonic solid —
 * and geometry is meant to appear at moments, not as wallpaper. There are only ever a
 * handful of these.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellBoundary } from '@es3/core';
import type { RevealedPlace } from '@es3/core';
import { beneathMarks, slotTranslate } from './cellMarks.js';
import { PLACE_KINDS, placeSpriteId, rasterisePlaces } from './placeSprites.js';
import { watchRemoval } from '../map/mapLife.js';

export const PLACE_SOURCE = 'places';
export const PLACE_HALO_LAYER = 'places-halo';
export const PLACE_CORE_LAYER = 'places-core';
export const PLACE_LABEL_LAYER = 'places-label';
export const PLACE_SPRITE_LAYER = 'places-sprite';

/*
 * Sigil §03: "Temple & Anchor — gold nimbus. The only two objects allowed a glow. Temple
 * carries a sacred-gold spark, the Anchor Stone an awareness-green core. If it glows, it
 * is sacred."
 *
 * These were the other way round — gold on the Anchor, cyan on temples — which also put
 * a temple in the same hue the map already spends on mana and on the current nav item.
 * Gold is the rarer colour and the temple is the rarer thing.
 */
const ANCHOR = '#00ff88'; /* --awareness-green */
const TEMPLE = '#ffd700'; /* --sacred-gold */

/** Centre of a cell, from its own boundary. Good enough for a marker. */
function centreOf(h3: string): [number, number] {
  const ring = cellBoundary(h3);
  let lng = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lng += x;
    lat += y;
  }
  return [lng / ring.length, lat / ring.length];
}

function toGeoJson(places: readonly RevealedPlace[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      id: place.h3,
      properties: {
        kind: place.kind,
        color: place.kind === 'anchor' ? ANCHOR : TEMPLE,
        label: place.kind === 'anchor' ? 'ANCHOR STONE' : `TEMPLE ${place.rank}`,
        size: place.kind === 'anchor' ? 1 : 0.7,
      },
      geometry: { type: 'Point', coordinates: centreOf(place.h3) },
    })),
  };
}

export function ensurePlaceLayers(map: MapLibreMap): void {
  if (map.getSource(PLACE_SOURCE)) return;

  map.addSource(PLACE_SOURCE, { type: 'geojson', data: toGeoJson([]) });

  // A soft glow, so a place reads as lit rather than pinned.
  map.addLayer({
    id: PLACE_HALO_LAYER,
    type: 'circle',
    source: PLACE_SOURCE,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.18,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 26, 19, 44],
      'circle-blur': 0.8,
    },
  });

  map.addLayer({
    id: PLACE_CORE_LAYER,
    type: 'circle',
    source: PLACE_SOURCE,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.9,
      'circle-radius': ['*', ['get', 'size'], 7],
      'circle-stroke-color': '#0a0612',
      'circle-stroke-width': 2,
    },
  });

  /*
   * The Temple or the Anchor Stone itself (Sigil §03, BRDC-SIGIL-006).
   *
   * Infinite: *"ei ole isometristä temppelin kuvaa.."* — a place was the dot above and a
   * name. It is the hex's structure, so it stands the way a Work does: bottom-anchored on
   * the centre, the same size, the same exponential growth with the hex. Hidden until its
   * pictures are in the atlas; the dot stands in until then, and steps aside after.
   *
   * It takes part in placement, so the name beside it yields where it would sit on the
   * roof. At walking zoom the structure *is* the name.
   */
  map.addLayer({
    id: PLACE_SPRITE_LAYER,
    type: 'symbol',
    source: PLACE_SOURCE,
    minzoom: 13,
    layout: {
      visibility: 'none',
      'icon-image': ['concat', 'place-', ['get', 'kind']],
      'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 13, 0.0625, 16, 0.5, 17, 1, 18, 2],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': false,
    },
  });

  /*
   * The name is the point.
   *
   * A player is meant to look at the map and realise "that is my temple" — a marker
   * with no name would leave them guessing at a dot.
   */
  map.addLayer({
    id: PLACE_LABEL_LAYER,
    type: 'symbol',
    source: PLACE_SOURCE,
    minzoom: 13,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-letter-spacing': 0.16,
      'text-anchor': 'bottom',
      'text-allow-overlap': false,
    },
    paint: {
      // The north slot (BRDC-SIGIL-006). South belongs to the strength figure, which §03
      // draws at the bottom of the hex; a fixed em offset had met it near zoom 16.
      'text-translate': slotTranslate('north'),
      'text-color': ['get', 'color'],
      'text-halo-color': '#0a0612',
      'text-halo-width': 2,
      'text-opacity': 0.9,
    },
  }, beneathMarks(map));

  // After the layers exist: if the pictures are already in this map's atlas, this shows
  // them straight away, and that needs the sprite layer to be there to show.
  void addPlaceSprites(map);
}

/** The pictures arrived: show the structures, and retire the dot that stood in for them. */
function showPlaceSprites(map: MapLibreMap): void {
  if (map.getLayer(PLACE_SPRITE_LAYER)) map.setLayoutProperty(PLACE_SPRITE_LAYER, 'visibility', 'visible');
  if (map.getLayer(PLACE_CORE_LAYER)) map.setLayoutProperty(PLACE_CORE_LAYER, 'visibility', 'none');
}

/**
 * Draw the Temple and Anchor into this map's atlas, once. `hasImage` is the check, not a
 * flag — a rebuilt map starts with an empty atlas. Guarded like every sprite loader: the
 * map can be removed while the pictures rasterise.
 */
async function addPlaceSprites(map: MapLibreMap): Promise<void> {
  if (PLACE_KINDS.every((kind) => map.hasImage(placeSpriteId(kind)))) {
    showPlaceSprites(map);
    return;
  }
  const life = watchRemoval(map);
  const images = await rasterisePlaces();
  life.stop();
  if (!images || life.gone()) return;
  for (const [id, data] of images) {
    if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
  }
  showPlaceSprites(map);
}

export function setPlaceData(map: MapLibreMap, places: readonly RevealedPlace[]): void {
  const source = map.getSource(PLACE_SOURCE);
  (source as { setData?: (d: FeatureCollection<Point>) => void })?.setData?.(toGeoJson(places));
}

export function removePlaceLayers(map: MapLibreMap): void {
  for (const id of [PLACE_LABEL_LAYER, PLACE_SPRITE_LAYER, PLACE_CORE_LAYER, PLACE_HALO_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(PLACE_SOURCE)) map.removeSource(PLACE_SOURCE);
}
