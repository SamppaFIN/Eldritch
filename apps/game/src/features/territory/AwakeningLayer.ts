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
export const AWAKENING_MS = 2_400;

/**
 * A cell's own moment, expressed against the single animated number.
 *
 * `progress` runs 0 → 2, `delay` 0 → 1, so `progress - delay` runs -1 → 2. It is the
 * opening of a parcel, not a flare: every cell sits under opaque gold — its territory
 * fill hidden — until `progress` reaches its `delay`, and then the lid lifts.
 *
 * FILL is the wrapping: high at or below 0, gone a third of a unit later. LINE is the
 * cell's edge: a faint outline on the wrapped parcel, a bright tear as the lid lifts,
 * then nothing, leaving the ordinary territory stroke underneath.
 */
export const WRAP_ALPHA_STOPS: readonly (readonly [number, number])[] = [
  [-1, 0.9],
  [0, 0.9],
  [0.35, 0],
];

export const TEAR_ALPHA_STOPS: readonly (readonly [number, number])[] = [
  [-1, 0.3],
  [0, 0.4],
  [0.12, 1],
  [0.55, 0.45],
  [1, 0],
];

function curve(
  progress: number,
  stops: readonly (readonly [number, number])[],
): ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['-', progress, ['get', 'delay']],
    ...stops.flat(),
  ] as unknown as ExpressionSpecification;
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
  map.setPaintProperty(AWAKENING_FILL_LAYER, 'fill-opacity', curve(progress, WRAP_ALPHA_STOPS));
  map.setPaintProperty(AWAKENING_LINE_LAYER, 'line-opacity', curve(progress, TEAR_ALPHA_STOPS));
}

/**
 * The resting state — nothing wrapped, no edge, the ordinary territory showing through.
 *
 * Its own function because the wrap curve is inverted: `setAwakeningProgress(map, 0)`
 * now means "everything still wrapped", not "cleared". Cleanup and the reduced-motion
 * path want this instead.
 */
export function clearAwakening(map: MapLibreMap): void {
  if (!map.getLayer(AWAKENING_FILL_LAYER)) return;
  map.setPaintProperty(AWAKENING_FILL_LAYER, 'fill-opacity', 0);
  map.setPaintProperty(AWAKENING_LINE_LAYER, 'line-opacity', 0);
}

export function removeAwakeningLayers(map: MapLibreMap): void {
  for (const id of [AWAKENING_LINE_LAYER, AWAKENING_FILL_LAYER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(AWAKENING_SOURCE)) map.removeSource(AWAKENING_SOURCE);
}
