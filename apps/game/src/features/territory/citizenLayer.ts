/**
 * A citizen at work on each staffed hex (BRDC-MAP-009, handoff F-12).
 *
 * One small figure swinging a pick, with a count when more than one works there. Drawn as
 * a symbol layer from a point source — never per-hex DOM. The swing is two frames swapped
 * on the whole layer by one timer, which stops while the page is hidden and never starts
 * under `prefers-reduced-motion`.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { motionGate, reducedMotion } from '../map/layerPulse.js';
import { cellCentre } from '@es3/core';
import type { H3Index } from '@es3/core';
import { rasteriseSvgs } from './spriteRaster.js';
import { watchRemoval } from '../map/mapLife.js';

const SOURCE = 'hex-citizens';
const LAYER = 'hex-citizens';
/** A little before the yields (zoom 16): the figure reads first, the numbers when closer. */
export const CITIZEN_MINZOOM = 15.5;
const PX = 40;
const FRAMES = ['up', 'down'] as const;
type Frame = (typeof FRAMES)[number];
export const citizenSpriteId = (f: Frame): string => `citizen-${f}`;
const FRAME_MS = 650;

/** Head, body, legs, and the pick raised or struck. Gold rim so it reads on any ground. */
const figure = (f: Frame): string => {
  const pick = f === 'up'
    ? '<path d="M24 10 L30 4" stroke="#c9b48a" stroke-width="2.5"/><path d="M27 2 L33 7" stroke="#a9cbdb" stroke-width="3"/>'
    : '<path d="M24 14 L32 18" stroke="#c9b48a" stroke-width="2.5"/><path d="M30 14 L33 21" stroke="#a9cbdb" stroke-width="3"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${PX}" height="${PX}">` +
    '<g stroke="#0a0612" stroke-width="5" stroke-linecap="round" fill="none"><path d="M18 14 V26 M18 26 L13 35 M18 26 L23 35 M18 17 L24 12"/></g>' +
    '<g stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M18 14 V26 M18 26 L13 35 M18 26 L23 35 M18 17 L24 12"/></g>' +
    `<g stroke-linecap="round">${pick}</g>` +
    '<circle cx="18" cy="9" r="4.5" fill="#ffd700" stroke="#0a0612" stroke-width="2"/></svg>';
};

export function citizenFeatures(hands: Readonly<Record<H3Index, number>>): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: Object.entries(hands)
      .filter(([, n]) => n > 0)
      .map(([h3, n]) => {
        const { lat, lng } = cellCentre(h3);
        return { type: 'Feature' as const, properties: { count: n > 1 ? `×${n}` : '' }, geometry: { type: 'Point' as const, coordinates: [lng, lat] } };
      }),
  };
}

export function ensureCitizenLayer(map: MapLibreMap): void {
  if (map.getSource(SOURCE)) return;
  map.addSource(SOURCE, { type: 'geojson', data: citizenFeatures({}) });
  map.addLayer({
    id: LAYER,
    type: 'symbol',
    source: SOURCE,
    minzoom: CITIZEN_MINZOOM,
    layout: {
      visibility: 'none',
      'icon-image': citizenSpriteId('up'),
      // Upper left of the hex: clear of the banner (top), the ground badge (centre), the
      // yield row (below it) and the strength figure (bottom).
      'icon-offset': [-26, -16],
      'text-field': ['get', 'count'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-anchor': 'left',
      'text-offset': [-1.2, -1.3],
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-ignore-placement': true,
    },
    paint: { 'text-color': '#ffd700', 'text-halo-color': '#0a0612', 'text-halo-width': 1.6 },
  });
  void addFrames(map);
}

async function addFrames(map: MapLibreMap): Promise<void> {
  if (!FRAMES.every((f) => map.hasImage(citizenSpriteId(f)))) {
    const life = watchRemoval(map);
    const images = await rasteriseSvgs(FRAMES, figure, citizenSpriteId, PX);
    life.stop();
    if (!images || life.gone()) return;
    for (const [id, data] of images) if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
  }
  if (map.getLayer(LAYER)) map.setLayoutProperty(LAYER, 'visibility', 'visible');
}

/** Whether anyone is at work at all — no swing, and no repaint, for an empty layer. */
let working = false;

export function setCitizenData(map: MapLibreMap, hands: Readonly<Record<H3Index, number>>): void {
  working = Object.values(hands).some((n) => n > 0);
  (map.getSource(SOURCE) as { setData?: (d: FeatureCollection<Point>) => void } | undefined)?.setData?.(citizenFeatures(hands));
}

/** Swing the picks: one timer for the whole layer. Returns the stop. */
export function animateCitizens(map: MapLibreMap): () => void {
  if (reducedMotion()) return () => {};
  // Same gate as the pulses (BRDC-FX-004): a rested map, a shown layer, someone at work.
  const gate = motionGate(map, LAYER);
  let frame: Frame = 'up';
  const id = window.setInterval(() => {
    if (!working || !gate.open()) return;
    frame = frame === 'up' ? 'down' : 'up';
    map.setLayoutProperty(LAYER, 'icon-image', citizenSpriteId(frame));
  }, FRAME_MS);
  return () => {
    window.clearInterval(id);
    gate.stop();
  };
}

export function removeCitizenLayer(map: MapLibreMap): void {
  if (map.getLayer(LAYER)) map.removeLayer(LAYER);
  if (map.getSource(SOURCE)) map.removeSource(SOURCE);
}
