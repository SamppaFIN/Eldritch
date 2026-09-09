/**
 * Whether the camera is pinned to the player, and the ways back to them (BRDC-MAP-004).
 *
 * The camera follows every GPS fix by default. A hand pan — a `dragstart` carrying a real
 * `originalEvent`, which a programmatic `easeTo`/`flyTo` never has — breaks the pin.
 * `recenter` restores it; `focusHere` also drops the zoom back to walking level and
 * flashes the cell underfoot, and is what the "Here" button calls.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import { cellAt } from '@es3/core';
import type { LatLng } from '@es3/core';
import { ZOOM_WALKING } from './useMap.js';
import { flashStandingHex } from './StandingFlash.js';

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export interface UseCameraFollowOptions {
  map: MlMap | null;
  ready: boolean;
  position: LatLng | null;
  touring: boolean;
}

export interface CameraFollow {
  following: boolean;
  recenter: () => void;
  focusHere: () => void;
}

export function useCameraFollow({
  map,
  ready,
  position,
  touring,
}: UseCameraFollowOptions): CameraFollow {
  const [following, setFollowing] = useState(true);
  /** False until the camera has met a real fix, so a reload knows to fly rather than crawl. */
  const arrived = useRef(false);
  /** The fix the camera has already been taken to, by whichever of the three moves did it. */
  const centredOn = useRef('');

  const fixKey = (p: LatLng) => `${p.lat},${p.lng}`;

  /*
   * Follow every fix while pinned.
   *
   * The first fix of a session is a different move from the rest. The map opens on
   * `useInitialPosition`'s answer, which is the Tampere fallback whenever the cold
   * high-accuracy fix outran its timeout — so on a reload the camera can start a long way
   * from the player. `easeTo` pans linearly, which over that distance at walking zoom is a
   * blur that never seems to arrive. `flyTo` is the move for it, and `essential` keeps it
   * under a reduced-motion preference.
   *
   * After that, easeTo, not jumpTo: a hard cut on every fix reads as a stutter while walking.
   *
   * `centredOn` is what keeps this from fighting `recenter`/`focusHere`. Both of those set
   * `following` true, which re-runs this effect — and two camera animations started on the
   * same fix contend for the same camera and land wherever the loser stops.
   */
  useEffect(() => {
    if (!map || !ready || !position) return;
    // While the tour drives the camera, or while the player has it, the camera is not
    // where we last put it — so forget that, or the next fix (same coordinates, standing
    // still) would be skipped and the camera would never come back.
    if (!following || touring) {
      centredOn.current = '';
      return;
    }
    const key = fixKey(position);
    if (key === centredOn.current) return;
    centredOn.current = key;

    const center: [number, number] = [position.lng, position.lat];
    if (arrived.current) {
      map.easeTo({ center, duration: 900 });
      return;
    }
    // No zoom here: the opening zoom is the caller's (a first launch opens wider,
    // ZOOM_FIRST_LOOK). This move is about where, not how close.
    arrived.current = true;
    map.flyTo({ center, duration: 700, essential: true });
  }, [map, ready, position, following, touring]);

  // Any hand-driven camera move — drag, wheel-zoom, pinch — unpins. A programmatic
  // easeTo/flyTo carries no originalEvent, so the follow effect and recenter don't trip it.
  useEffect(() => {
    if (!map || !ready) return;
    const unpin = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent) setFollowing(false);
    };
    map.on('dragstart', unpin);
    map.on('zoomstart', unpin);
    return () => {
      map.off('dragstart', unpin);
      map.off('zoomstart', unpin);
    };
  }, [map, ready]);

  const recenter = useCallback(() => {
    setFollowing(true);
    if (!map || !position) return;
    arrived.current = true;
    centredOn.current = fixKey(position);
    map.flyTo({ center: [position.lng, position.lat], duration: 500, essential: true });
  }, [map, position]);

  const focusHere = useCallback(() => {
    setFollowing(true);
    if (!map || !position) return;
    arrived.current = true;
    centredOn.current = fixKey(position);
    map.flyTo({
      center: [position.lng, position.lat],
      zoom: ZOOM_WALKING,
      duration: 500,
      essential: true,
    });
    flashStandingHex(map, cellAt(position), prefersReduced());
  }, [map, position]);

  return { following, recenter, focusHere };
}
