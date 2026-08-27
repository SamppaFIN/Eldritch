/**
 * The ground waking up — MapLibre plumbing only.
 *
 * A short-lived layer drawn on top of the territory, holding just the cells a closure
 * has taken. It lights them from the middle outward, then fades and leaves the ordinary
 * territory fill underneath. Nothing here decides anything; the ordering lives in
 * awakening.ts, where it is tested.
 *
 * One number is animated across the whole set. Per-feature state would mean touching the
 * source every frame at the exact moment MapLibre is already rasterising new hexagons.
 */
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { H3Index } from '@es3/core';
import { awakeningFeatures } from './awakening.js';

export const AWAKENING_SOURCE = 'awakening';
export const AWAKENING_FILL_LAYER = 'awakening-fill';
export const AWAKENING_LINE_LAYER = 'awakening-line';

const GOLD = '#ffd700'; // --sacred-gold

/** How long the whole ripple takes, edge included. */
export const AWAKENING_MS = 2_000;

/**
 * A cell's own moment, expressed against the single animated number.
 *
 * `progress` runs 0 → 2. A cell whose delay has not been reached yet is dark; it flares
 * as `progress` passes, holds briefly, then fades. The stagger is 1.0 wide and the flare
 * itself 1.0, which is why progress runs past 1.
 */
function opacityFor(progress: number, peak: number): ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['-', progress, ['get', 'delay']],
    0,
    0,
    0.25,
    peak,
    0.6,
    peak,
    1,
    0,
  ];
}

export function ensureAwakeningLayers(map: MapLibreMap): void {
  if (map.getSource(AWAKENING_SOURCE)) return;

  map.addSource(AWAKENING_SOURCE, {
    type: 'geojson',
    data: awakeningFeatures([]),
  });

  map.addLayer({
    id: AWAKENING_FILL_LAYER,
    type: 'fill',
    source: AWAKENING_SOURCE,
    paint: { 'fill-color': GOLD, 'fill-opacity': 0 },
  });

  // The stroke carries most of the reading: a hexagon outlined in gold is unmistakably
  // a claimed cell, where a gold wash alone could be any highlight.
  map.addLayer({
    id: AWAKENING_LINE_LAYER,
    type: 'line',
    source: AWAKENING_SOURCE,
    layout: { 'line-join': 'round' },
    paint: {
      'line-color': GOLD,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 2.5, 19, 4],
      'line-opacity': 0,
    },
  });
}

/** Load a claim's cells. Call once when the claim lands, then drive it with `setProgress`. */
export function setAwakeningCells(map: MapLibreMap, cells: readonly H3Index[]): void {
  const source = map.getSource(AWAKENING_SOURCE);
  (source as { setData?: (d: ReturnType<typeof awakeningFeatures>) => void })?.setData?.(
    awakeningFeatures(cells),
  );
}

export function setAwakeningProgress(map: MapLibreMap, progress: number): void {
  if (!map.getLayer(AWAKENING_FILL_LAYER)) return;
  map.setPaintProperty(AWAKENING_FILL_LAYER, 'fill-opacity', opacityFor(progress, 0.75));
  map.setPaintProperty(AWAKENING_LINE_LAYER, 'line-opacity', opacityFor(progress, 1));
}

export function removeAwakeningLayers(map: MapLibreMap): void {
  for (const id of [AWAKENING_LINE_LAYER, AWAKENING_FILL_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(AWAKENING_SOURCE)) map.removeSource(AWAKENING_SOURCE);
}
