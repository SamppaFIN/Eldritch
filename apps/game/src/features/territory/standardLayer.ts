/**
 * Your standard on the map (BRDC-STANDARD-001): a flagpole on the hex it was planted on,
 * its pennant in the realm's own colours — the purple your ground is drawn in, edged in
 * gold. One symbol layer off one point, never a DOM marker.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre } from '@es3/core';
import type { H3Index } from '@es3/core';
import { rasteriseSvgs } from './spriteRaster.js';
import { watchRemoval } from '../map/mapLife.js';

const SOURCE = 'standard';
const POLE = 'standard-pole';
const PX = 96;
const POLE_ID = 'standard-flag';

const POLE_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${PX}" height="${PX}">` +
  '<ellipse cx="14" cy="45" rx="7" ry="2.2" fill="#000" fill-opacity=".45"/>' +
  '<path d="M14 45 V6" stroke="#0a0612" stroke-width="4" stroke-linecap="round"/>' +
  '<path d="M14 45 V6" stroke="#c9b48a" stroke-width="2" stroke-linecap="round"/>' +
  '<path d="M15 8 C24 5 30 12 40 9 L36 18 L40 27 C30 30 24 23 15 26 Z" fill="#4a1a5c" stroke="#ffd700" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<circle cx="14" cy="5" r="2.6" fill="#ffd700" stroke="#0a0612" stroke-width="1"/></svg>';


export function standardFeatures(h3: H3Index | null): FeatureCollection<Point> {
  if (!h3) return { type: 'FeatureCollection', features: [] };
  const { lat, lng } = cellCentre(h3);
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng, lat] } }] };
}

export function ensureStandardLayers(map: MapLibreMap): void {
  if (map.getSource(SOURCE)) return;
  map.addSource(SOURCE, { type: 'geojson', data: standardFeatures(null) });
  map.addLayer({
    id: POLE,
    type: 'symbol',
    source: SOURCE,
    minzoom: 13,
    layout: {
      visibility: 'none',
      'icon-image': POLE_ID,
      'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 13, 0.25, 16, 0.6, 18, 1.4],
      'icon-anchor': 'bottom-left',
      'icon-offset': [-14, 0],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });
  void addPole(map);
}

async function addPole(map: MapLibreMap): Promise<void> {
  if (!map.hasImage(POLE_ID)) {
    const life = watchRemoval(map);
    const images = await rasteriseSvgs([POLE_ID], () => POLE_SVG, (id) => id, PX);
    life.stop();
    if (!images || life.gone()) return;
    for (const [id, data] of images) if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
  }
  if (map.getLayer(POLE)) map.setLayoutProperty(POLE, 'visibility', 'visible');
}

export function setStandardData(map: MapLibreMap, h3: H3Index | null): void {
  (map.getSource(SOURCE) as { setData?: (d: FeatureCollection<Point>) => void } | undefined)?.setData?.(standardFeatures(h3));
}

export function removeStandardLayers(map: MapLibreMap): void {
  if (map.getLayer(POLE)) map.removeLayer(POLE);
  if (map.getSource(SOURCE)) map.removeSource(SOURCE);
}
