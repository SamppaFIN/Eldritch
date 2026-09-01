/**
 * The ground wakes up — the animation, lifted out of MapCanvas.
 *
 * The claim is already painted by the time this runs. The reveal is a gold flare over the
 * top of it, rippling out from the middle of what was taken, driven frame by frame rather
 * than by CSS because the shapes are on the GPU and not in the DOM.
 *
 * Its own file only because MapCanvas was at the line limit; the layer internals are in
 * `AwakeningLayer.js`, the ordering in `awakening.js`.
 */
import { useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { CLAIM_YIELD, cellCentre, resourceOf } from '@es3/core';
import type { H3Index } from '@es3/core';
import {
  AWAKENING_MS,
  setAwakeningCells,
  setAwakeningProgress,
} from '../territory/AwakeningLayer.js';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import './gains-flyup.css';

/** "+10 timber" rising and fading over each cell a loop just took. */
function flyGains(map: MapLibreMap, cells: readonly H3Index[]): void {
  const container = map.getCanvasContainer();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  for (const h3 of cells) {
    const res = resourceOf(h3);
    if (!res) continue;
    const c = cellCentre(h3);
    const p = map.project([c.lng, c.lat]);
    const el = document.createElement('div');
    el.className = reduced ? 'gains-flyup gains-flyup--still' : 'gains-flyup';
    el.textContent = `+${CLAIM_YIELD} ${RESOURCE_WORD[res]}`;
    el.style.color = RESOURCE_COLOUR[res];
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => el.remove(), 2500);
  }
}

export function useAwakening(
  map: MapLibreMap | null,
  ready: boolean,
  awakening: { cells: readonly H3Index[]; at: number } | null,
): void {
  useEffect(() => {
    if (!map || !ready || !awakening || awakening.cells.length === 0) return;

    setAwakeningCells(map, awakening.cells);
    flyGains(map, awakening.cells);

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      // Still say something happened, without the sweep across the screen.
      setAwakeningProgress(map, 1.2);
      const timer = setTimeout(() => setAwakeningProgress(map, 0), 600);
      return () => clearTimeout(timer);
    }

    let frame = 0;
    const started = performance.now();
    const tick = (t: number) => {
      // 0 → 2: one unit of stagger across the cells, one of flare for each of them.
      const progress = ((t - started) / AWAKENING_MS) * 2;
      setAwakeningProgress(map, Math.min(progress, 2));
      if (progress < 2) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      // Leaving it mid-flare would freeze a gold wash over the map until the next claim.
      if (map.loaded()) setAwakeningProgress(map, 0);
    };
  }, [map, ready, awakening]);
}
