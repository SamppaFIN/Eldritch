/**
 * A slow pulse on one map layer (BRDC-FX-004): the temple's glow, the anomaly's mark.
 *
 * GL sprites take no CSS, so a paint property is stepped along a sine — six steps over
 * 2.4 s, one repaint each, never a transition that keeps the map drawing every frame. One
 * timer per layer; it rests while the page is hidden, and under reduced motion there is
 * no timer at all.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';

const STEPS = 6;
const STEP_MS = 400;

/** The value at step `i` of a cycle from `low` up to `high` and back. */
export function pulseValue(i: number, low: number, high: number): number {
  return low + (high - low) * (0.5 - 0.5 * Math.cos((2 * Math.PI * (i % STEPS)) / STEPS));
}

export function pulsePaint(map: MapLibreMap, layer: string, property: Parameters<MapLibreMap['setPaintProperty']>[1], low: number, high: number): () => void {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {};
  let i = 0;
  const id = window.setInterval(() => {
    if (document.hidden || !map.getLayer(layer)) return;
    i += 1;
    map.setPaintProperty(layer, property, pulseValue(i, low, high));
  }, STEP_MS);
  return () => window.clearInterval(id);
}
