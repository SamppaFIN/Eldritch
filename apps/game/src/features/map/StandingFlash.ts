/**
 * One hex outline, flashed once and gone (BRDC-MAP-004).
 *
 * The "Here" button flies the camera to the cell underfoot; this draws that cell's edge,
 * bright, then fades it over ~1.4 s and clears the source. Not a persistent "you are
 * here" ring — a momentary "there" so the eye lands on the right hex after the camera
 * moves.
 *
 * Wholly imperative and rare (one button press), so it owns its own layer and animation
 * frame rather than living in MapCanvas's layer wiring.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellBoundary } from '@es3/core';

const SOURCE = 'standing-flash';
const LAYER = 'standing-flash-line';
const CYAN = '#00d4ff'; // --mystic-cyan
const FLASH_MS = 1_400;
const PEAK = 0.9;

let frame = 0;

type Empty = { type: 'FeatureCollection'; features: [] };
type Ring = ReturnType<typeof ringOf>;

function ringOf(h3: string) {
  const coords = cellBoundary(h3); // [lng, lat] pairs, GeoJSON order, open ring
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'Polygon' as const, coordinates: [[...coords, coords[0]]] },
      },
    ],
  };
}

function ensure(map: MapLibreMap): void {
  if (map.getSource(SOURCE)) return;
  const empty: Empty = { type: 'FeatureCollection', features: [] };
  map.addSource(SOURCE, { type: 'geojson', data: empty });
  map.addLayer({
    id: LAYER,
    type: 'line',
    source: SOURCE,
    layout: { 'line-join': 'round' },
    paint: {
      'line-color': CYAN,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 3, 19, 4.5],
      'line-opacity': 0,
    },
  });
}

function setData(map: MapLibreMap, data: Ring | Empty): void {
  (map.getSource(SOURCE) as { setData?: (d: Ring | Empty) => void } | undefined)?.setData?.(data);
}

/** Draw `h3`'s edge and fade it out. `null` clears it. A fresh call restarts, never stacks. */
export function flashStandingHex(map: MapLibreMap, h3: string | null, reduced: boolean): void {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  ensure(map);

  if (!h3) {
    setData(map, { type: 'FeatureCollection', features: [] });
    return;
  }
  setData(map, ringOf(h3));

  if (reduced) {
    map.setPaintProperty(LAYER, 'line-opacity', PEAK);
    window.setTimeout(() => {
      if (map.getLayer(LAYER)) map.setPaintProperty(LAYER, 'line-opacity', 0);
    }, 500);
    return;
  }

  const start = performance.now();
  const tick = (t: number) => {
    if (!map.getLayer(LAYER)) return;
    const k = Math.min(1, (t - start) / FLASH_MS);
    map.setPaintProperty(LAYER, 'line-opacity', PEAK * (1 - k * k));
    frame = k < 1 ? requestAnimationFrame(tick) : 0;
  };
  frame = requestAnimationFrame(tick);
}
