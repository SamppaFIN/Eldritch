/**
 * The ground wakes up — the animation, lifted out of MapCanvas.
 *
 * The claim is already painted by the time this runs. The reveal opens it like a parcel:
 * each taken cell sits under opaque gold, and one at a time — rippling out from the
 * middle — the gold lifts to show the ground underneath, a sacred-geometry sigil bursting
 * outward as its lid comes off. The layer is driven frame by frame because the hexagons
 * are on the GPU; the sigils and the "+10 timber" are projected DOM, like every other
 * per-cell flourish on this map.
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
  clearAwakening,
  setAwakeningCells,
  setAwakeningProgress,
} from '../territory/AwakeningLayer.js';
import { awakeningFeatures } from '../territory/awakening.js';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import './gains-flyup.css';
import './gift-reveal.css';

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

/** Six points of a hexagon at `r`, rotated `rot` degrees, in the sigil's 100×100 box. */
function hexPts(r: number, rot: number): string {
  const a0 = (rot * Math.PI) / 180;
  return Array.from({ length: 6 }, (_, i) => {
    const a = a0 + (Math.PI * 2 * i) / 6;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/** Three concentric hexagons, all stroke — the claim burst's mandala, one cell's worth. */
const SIGIL_SVG =
  '<svg viewBox="0 0 100 100" width="72" height="72" aria-hidden="true">' +
  '<g fill="none" stroke="#ffd700" stroke-width="1.5" vector-effect="non-scaling-stroke">' +
  `<polygon points="${hexPts(46, -90)}"/>` +
  `<polygon points="${hexPts(30, -60)}"/>` +
  `<polygon points="${hexPts(15, -90)}"/>` +
  '</g></svg>';

/** One sigil, drawn on and burst outward as its cell unwraps. Cleans itself up. */
function spawnSigil(map: MapLibreMap, h3: H3Index, reduced: boolean): void {
  const c = cellCentre(h3);
  const p = map.project([c.lng, c.lat]);
  const el = document.createElement('div');
  el.className = reduced ? 'gift-sigil gift-sigil--still' : 'gift-sigil';
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
  el.innerHTML = SIGIL_SVG;
  map.getCanvasContainer().appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), AWAKENING_MS + 1500);
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

    // Each sigil is timed to its cell's place in the ripple — the delay `awakening.js`
    // already worked out for the gold layer.
    const feats = awakeningFeatures(awakening.cells);
    const timers = feats.features.map((f) => {
      const wait = reduced ? 0 : Math.round(((f.properties?.delay as number) ?? 0) * AWAKENING_MS);
      return window.setTimeout(() => spawnSigil(map, f.id as H3Index, reduced), wait);
    });

    if (reduced) {
      // The territory is already painted; the still sigils say a hex was opened. No sweep.
      clearAwakening(map);
      return () => timers.forEach(clearTimeout);
    }

    let frame = 0;
    const started = performance.now();
    const tick = (t: number) => {
      // 0 → 2: one unit of stagger across the cells, one of lid-lift for each of them.
      const progress = ((t - started) / AWAKENING_MS) * 2;
      setAwakeningProgress(map, Math.min(progress, 2));
      if (progress < 2) frame = requestAnimationFrame(tick);
      else if (map.loaded()) clearAwakening(map);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      // Leaving it mid-lift would freeze a gold wash over the map until the next claim.
      if (map.loaded()) clearAwakening(map);
    };
  }, [map, ready, awakening]);
}
