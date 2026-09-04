/**
 * The founding tour — the camera walks the six hexes around a new Hearth (BRDC-CLAIM-012).
 *
 * A new game hands the player a home cell and a ring of six around it, all claimed before
 * they take a step. Without a beat spent on it the ring is just... there. Once, right
 * after the Hearth is accepted, the camera flies out and pauses over each neighbour in
 * turn, then settles back on the player at walking zoom. It is the whole of the opening
 * that says "this is yours" without a line of tutorial text.
 *
 * Runs only in the session the Hearth was founded (the mark is minutes old) and only
 * once (a localStorage flag a full reset clears). A drag bails out — the player is not
 * trapped in it.
 */
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre, load, neighboursOf } from '@es3/core';
import type { H3Index } from '@es3/core';
import { ZOOM_WALKING } from './useMap.js';

const FLAG = 'es3:hearth-tour';
/** Only tour when the Hearth was accepted in this session, not on every later boot. */
const JUST_FOUNDED_MS = 120_000;
const TOUR_ZOOM = 17;
const HOP_MS = 900;
const DWELL_MS = 650;

export function useHearthTour(
  map: MapLibreMap | null,
  ready: boolean,
  home: H3Index | null,
): boolean {
  const [touring, setTouring] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !map || !ready || !home) return;

    const mark = load<{ at: number } | null>('hearth', null);
    if (!mark || Date.now() - mark.at > JUST_FOUNDED_MS) return;
    try {
      if (localStorage.getItem(FLAG)) return;
      localStorage.setItem(FLAG, '1');
    } catch {
      /* private mode: run it, just do not remember that it ran */
    }
    done.current = true;

    const back = cellCentre(home);
    const settle = () => map.easeTo({ center: [back.lng, back.lat], zoom: ZOOM_WALKING, duration: HOP_MS });

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const ring = neighboursOf(home).map(cellCentre);
    if (reduced || ring.length === 0) {
      map.easeTo({ center: [back.lng, back.lat], zoom: ZOOM_WALKING, duration: reduced ? 0 : HOP_MS });
      return;
    }

    setTouring(true);
    let i = 0;
    let timer = 0;
    const bail = () => {
      clearTimeout(timer);
      setTouring(false);
      settle();
    };
    const step = () => {
      if (i >= ring.length) {
        map.flyTo({ center: [back.lng, back.lat], zoom: ZOOM_WALKING, duration: HOP_MS, essential: true });
        timer = window.setTimeout(() => setTouring(false), HOP_MS);
        return;
      }
      const c = ring[i]!;
      i += 1;
      map.flyTo({ center: [c.lng, c.lat], zoom: TOUR_ZOOM, duration: HOP_MS, essential: true });
      timer = window.setTimeout(step, HOP_MS + DWELL_MS);
    };
    map.once('dragstart', bail);
    step();

    return () => {
      clearTimeout(timer);
      map.off('dragstart', bail);
      setTouring(false);
    };
  }, [map, ready, home]);

  return touring;
}
