/**
 * Read the ground around the player off the map, before they walk onto it
 * (BRDC-SURVEY-001).
 *
 * `useTerrainResolver` reads tiles for cells the player *already owns*, which is too late:
 * the claim yield is paid the instant ground changes hands, from the hash, and the tile
 * reading lands a few hundred milliseconds after that. This sweeps ahead of the feet
 * instead, so by the time a hex is stepped on the game already knows whether it is a lake.
 *
 * It costs no network. MapLibre has already drawn these tiles; `queryRenderedFeatures` is
 * a hit-test against what is on screen. That is also its one limit — a point outside the
 * viewport returns nothing — so this reads a ring around the player, who is by definition
 * in view, and skips anything already read.
 *
 * Like `useTerrainResolver`, the browser half is exercised in the browser. The part with a
 * decision in it, `pendingSurvey`, is pure and tested.
 */
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellAt, cellCentre, cellsWithin, recordSurvey, terrainFromTiles } from '@es3/core';
import type { H3Index, LatLng, TerrainKind } from '@es3/core';

/**
 * How far around the player to read, in hex rings.
 *
 * Ten rings is 331 hexes, a little over 300 m across — roughly what is both on screen at
 * walking zoom and reachable before the sweep would run again anyway. Larger rings mostly
 * buy hexes outside the viewport, which read as nothing.
 */
export const SURVEY_RADIUS = 10;

/**
 * Below this the tiles are generalised and a hit-test lies.
 *
 * At zoom 12 a city block's worth of geometry collapses into one feature, and a hex beside
 * a pond comes back as lake. The editor's grid draws from 13 for the same reason.
 */
export const SURVEY_MIN_ZOOM = 13;

/** Hit-tests per pass. Sixty keeps a pass well inside a frame on a mid-range phone. */
export const SURVEY_CHUNK = 60;

/**
 * Which hexes to read next: the ring around `centre`, minus everything already read.
 *
 * Pure, so the batching rule is testable. Returns at most `SURVEY_CHUNK`, nearest first —
 * `cellsWithin` returns the disk in ring order, so the ground under the player's next step
 * is read before the edge of the neighbourhood.
 */
export function pendingSurvey(
  centre: H3Index,
  done: ReadonlySet<H3Index>,
  radius = SURVEY_RADIUS,
  limit = SURVEY_CHUNK,
): H3Index[] {
  const out: H3Index[] = [];
  for (const h3 of cellsWithin(centre, radius)) {
    if (done.has(h3)) continue;
    out.push(h3);
    if (out.length === limit) break;
  }
  return out;
}

/** Run `fn` when the browser is idle, or on a short timer where that does not exist. */
function whenIdle(fn: () => void): () => void {
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (!ric) {
    const id = setTimeout(fn, 250);
    return () => clearTimeout(id);
  }
  const handle = ric(fn);
  return () => (globalThis as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(handle);
}

export interface UseNearbySurveyOptions {
  map: MapLibreMap | null;
  ready: boolean;
  /** Where the player is, or null while there is no fix. */
  position: LatLng | null;
}

export function useNearbySurvey({ map, ready, position }: UseNearbySurveyOptions): void {
  const done = useRef<Set<H3Index>>(new Set());
  /** Bumped after every pass, so the effect re-runs until the ring is exhausted. */
  const [pass, setPass] = useState(0);

  useEffect(() => {
    if (!map || !ready || !position) return;
    if (map.getZoom() < SURVEY_MIN_ZOOM) return;

    const batch = pendingSurvey(cellAt(position), done.current);
    if (batch.length === 0) return;

    return whenIdle(() => {
      const readings: Record<H3Index, TerrainKind> = {};
      for (const h3 of batch) {
        done.current.add(h3);
        const { lat, lng } = cellCentre(h3);
        const kind = terrainFromTiles(map.queryRenderedFeatures(map.project([lng, lat])));
        if (kind) readings[h3] = kind;
      }
      recordSurvey(readings);
      setPass((n) => n + 1);
    });
  }, [map, ready, position, pass]);
}
