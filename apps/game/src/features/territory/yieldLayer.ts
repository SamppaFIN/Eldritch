/**
 * What each hex of yours makes, on the hex (BRDC-MAP-008, handoff F-11) — Civilization's
 * yield icons, from street zoom in.
 *
 * Read from `repository.yields`, the per-hex model the pouch is paid by (BRDC-YIELD-001).
 * Up to three resources a hex, largest first, laid out in three fixed slots (left, centre,
 * right) so one sits in the middle and two sit either side of it: three symbol layers off
 * one point source, because an icon's offset cannot be read from feature data as an array.
 * No HTML markers — the map draws hundreds of these.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre, RESOURCE_KINDS } from '@es3/core';
import type { H3Index, HexYield, ResourceKind } from '@es3/core';
import { MAP_RESOURCE_COLOUR } from './territoryFeatures.js';
import { rasteriseSvgs } from './spriteRaster.js';
import { watchRemoval } from '../map/mapLife.js';

/** The zoom the overlay appears at (handoff D5): street level, where a hex is ~80 px wide. */
export const YIELD_OVERLAY_MINZOOM = 16;

const SOURCE = 'hex-yields';
const SLOTS = ['l', 'c', 'r'] as const;
type Slot = (typeof SLOTS)[number];
const layerId = (s: Slot) => `hex-yields-${s}`;
/** Slot centres, px, left of / at / right of the hex centre; a row below the ground's
 *  badge, so the two never sit on each other. Each slot is an icon with its number beside it. */
const X: Readonly<Record<Slot, number>> = { l: -28, c: 0, r: 28 };
const Y = 16;

const YIELD_PX = 32;
export const yieldIconId = (k: ResourceKind): string => `res-${k}`;

/** One small glyph per resource, filled in its map colour with a dark rim for daylight. */
const GLYPH: Readonly<Record<ResourceKind, string>> = {
  wood: '<path d="M16 4 L26 24 H6 Z"/><rect x="14" y="24" width="4" height="5"/>',
  stone: '<rect x="6" y="9" width="20" height="16" rx="4"/>',
  iron: '<path d="M6 22 L10 10 H22 L26 22 Z"/>',
  food: '<ellipse cx="12" cy="12" rx="3.5" ry="6"/><ellipse cx="20" cy="12" rx="3.5" ry="6"/><ellipse cx="16" cy="22" rx="3.5" ry="6"/>',
  gold: '<circle cx="16" cy="16" r="10"/>',
  wisdom: '<path d="M4 16 Q16 4 28 16 Q16 28 4 16 Z"/>',
  mana: '<path d="M16 3 L25 16 L16 29 L7 16 Z"/>',
  culture: '<path d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z"/>',
  tokens: '<path d="M16 4 L26 10 V22 L16 28 L6 22 V10 Z"/>',
};

const glyphSvg = (k: ResourceKind): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${YIELD_PX}" height="${YIELD_PX}">` +
  `<g fill="${MAP_RESOURCE_COLOUR[k]}" stroke="#0a0612" stroke-width="2" stroke-linejoin="round">${GLYPH[k]}</g></svg>`;

/** "3", "1.5", "12" — no sign; the overlay only ever shows what is made. */
export const yieldAmount = (n: number): string => (n >= 10 || Number.isInteger(Math.round(n * 10) / 10) ? String(Math.round(n)) : (Math.round(n * 10) / 10).toFixed(1));

/** The point features: up to three positive resources a hex, placed into the slots. */
export function yieldFeatures(yields: Readonly<Record<H3Index, HexYield>>): FeatureCollection<Point> {
  const features = Object.entries(yields).flatMap(([h3, y]) => {
    const top = (Object.entries(y.totals) as [ResourceKind, number][])
      .filter(([, v]) => v >= 0.5)
      .sort((a, z) => z[1] - a[1])
      .slice(0, 3);
    if (top.length === 0) return [];
    const slots: readonly Slot[] = top.length === 1 ? ['c'] : top.length === 2 ? ['l', 'r'] : ['l', 'c', 'r'];
    const properties: Record<string, string> = {};
    top.forEach(([k, v], i) => {
      properties[`r${slots[i]}`] = k;
      properties[`a${slots[i]}`] = yieldAmount(v);
    });
    const { lat, lng } = cellCentre(h3);
    return [{ type: 'Feature' as const, properties, geometry: { type: 'Point' as const, coordinates: [lng, lat] } }];
  });
  return { type: 'FeatureCollection', features };
}

export function ensureYieldLayers(map: MapLibreMap): void {
  if (map.getSource(SOURCE)) return;
  map.addSource(SOURCE, { type: 'geojson', data: yieldFeatures({}) });
  for (const s of SLOTS) {
    map.addLayer({
      id: layerId(s),
      type: 'symbol',
      source: SOURCE,
      minzoom: YIELD_OVERLAY_MINZOOM,
      filter: ['has', `r${s}`],
      layout: {
        visibility: 'none',
        'icon-image': ['concat', 'res-', ['get', `r${s}`]],
        'icon-offset': [X[s] - 7, Y],
        'text-field': ['get', `a${s}`],
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
        'text-anchor': 'left',
        'text-offset': [(X[s] + 2) / 12, Y / 12],
        'icon-allow-overlap': true,
        'text-allow-overlap': true,
        'icon-ignore-placement': true,
        'text-ignore-placement': true,
      },
      paint: { 'text-color': '#f4effa', 'text-halo-color': '#0a0612', 'text-halo-width': 1.6 },
    });
  }
  void addYieldIcons(map);
}

async function addYieldIcons(map: MapLibreMap): Promise<void> {
  if (RESOURCE_KINDS.every((k) => map.hasImage(yieldIconId(k)))) return;
  const life = watchRemoval(map);
  const images = await rasteriseSvgs(RESOURCE_KINDS, glyphSvg, yieldIconId, YIELD_PX);
  life.stop();
  if (!images || life.gone()) return;
  for (const [id, data] of images) if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
}

export function setYieldData(map: MapLibreMap, yields: Readonly<Record<H3Index, HexYield>>, visible: boolean): void {
  (map.getSource(SOURCE) as { setData?: (d: FeatureCollection<Point>) => void } | undefined)?.setData?.(yieldFeatures(yields));
  for (const s of SLOTS) if (map.getLayer(layerId(s))) map.setLayoutProperty(layerId(s), 'visibility', visible ? 'visible' : 'none');
}

export function removeYieldLayers(map: MapLibreMap): void {
  for (const s of SLOTS) if (map.getLayer(layerId(s))) map.removeLayer(layerId(s));
  if (map.getSource(SOURCE)) map.removeSource(SOURCE);
}
