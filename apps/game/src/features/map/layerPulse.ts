/**
 * A slow pulse on one map layer (BRDC-FX-004): the temple's glow, the anomaly's mark.
 *
 * GL sprites take no CSS, so a paint property is stepped along a sine — six steps over
 * 2.4 s, one repaint each, never a transition that keeps the map drawing every frame. One
 * timer per layer; it rests while the page is hidden, and under reduced motion there is
 * no timer at all.
 *
 * Every step repaints the whole map, and a realm of 5 000 hexes takes longer to paint than
 * a step lasts — stepping on regardless kept the map busy for good (claim.spec: idle in
 * 8 s, not 1.3 s). So a step waits for the map to have rested since the last one, and
 * skips a layer the zoom does not show (`motionGate`).
 */
import type { Map as MapLibreMap } from 'maplibre-gl';

const STEPS = 6;
const STEP_MS = 400;

/** The value at step `i` of a cycle from `low` up to `high` and back. */
export function pulseValue(i: number, low: number, high: number): number {
  return low + (high - low) * (0.5 - 0.5 * Math.cos((2 * Math.PI * (i % STEPS)) / STEPS));
}

export const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** May a map animation take its next step? Only on a rested map, a shown layer, a seen page. */
export function motionGate(map: MapLibreMap, layer: string): { open: () => boolean; stop: () => void } {
  let rested = false; // closed until the map has drawn itself once
  const onIdle = () => {
    rested = true;
  };
  map.on('idle', onIdle);
  return {
    open: () => {
      const l = map.getLayer(layer);
      if (document.hidden || !rested || !l || map.getZoom() < (l.minzoom ?? 0)) return false;
      rested = false;
      return true;
    },
    stop: () => map.off('idle', onIdle),
  };
}

export function pulsePaint(map: MapLibreMap, layer: string, property: Parameters<MapLibreMap['setPaintProperty']>[1], low: number, high: number): () => void {
  if (reducedMotion()) return () => {};
  const gate = motionGate(map, layer);
  let i = 0;
  const id = window.setInterval(() => {
    if (!gate.open()) return;
    i += 1;
    map.setPaintProperty(layer, property, pulseValue(i, low, high));
  }, STEP_MS);
  return () => {
    window.clearInterval(id);
    gate.stop();
  };
}
