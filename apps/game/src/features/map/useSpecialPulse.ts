/**
 * One pulse for the cells that need looking at (BRDC-FX-003).
 *
 * §13 says contested cells pulse; since BRDC-CLAIM-017 the common case is your own ground
 * about to fall to the Void. Both are line layers, and one ~10 fps loop moves their
 * opacity together. Any animation repaints the whole map every frame it runs, so the loop
 * runs only while such a cell is actually on screen, and never with the page hidden,
 * with reduced motion asked for, or in Daylight mode (the plate is for reading, not for
 * movement). Every other cell and building on the map is still.
 */
import { useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { CELL_CONTESTED_LAYER } from '../territory/layerIds.js';
import { CELL_FADING_LAYER } from '../territory/TerritoryLayer.js';

/** The two layers and the opacity each rests at when the pulse is off. */
export const PULSE_LAYERS: readonly (readonly [string, number])[] = [
  [CELL_CONTESTED_LAYER, 0.85],
  [CELL_FADING_LAYER, 0.8],
];
export const PULSE_PERIOD_MS = 1_600;
const FRAME_MS = 100;

/** Opacity at time `t` — between 0.3 and 0.9. Pure, so the curve has a test. */
export function pulseOpacity(t: number): number {
  return 0.3 + 0.6 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / PULSE_PERIOD_MS));
}

const calm = () =>
  document.hidden ||
  document.documentElement.hasAttribute('data-daylight') ||
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

export function useSpecialPulse(map: MapLibreMap | null, ready: boolean, cells: unknown): void {
  useEffect(() => {
    if (!map || !ready) return;
    let frame = 0;
    let last = 0;
    let running = false;

    const present = () => PULSE_LAYERS.map(([id]) => id).filter((id) => map.getLayer(id));
    const rest = () => {
      for (const [id, o] of PULSE_LAYERS) if (map.getLayer(id)) map.setPaintProperty(id, 'line-opacity', o);
    };
    const tick = (t: number) => {
      if (!running) return;
      if (t - last >= FRAME_MS) {
        last = t;
        const o = pulseOpacity(t);
        for (const id of present()) map.setPaintProperty(id, 'line-opacity', o);
      }
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
      rest();
    };
    /** Start or stop on what is on screen now. */
    const check = () => {
      const layers = present();
      const any = layers.length > 0 && map.queryRenderedFeatures({ layers }).length > 0;
      if (any && !calm()) {
        if (!running) {
          running = true;
          frame = requestAnimationFrame(tick);
        }
      } else stop();
    };

    check();
    map.on('moveend', check);
    map.on('idle', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      stop();
      map.off('moveend', check);
      map.off('idle', check);
      document.removeEventListener('visibilitychange', check);
    };
    // `cells` re-checks when the ground changes; `idle` catches the rest.
  }, [map, ready, cells]);
}
