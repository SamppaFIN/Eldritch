/**
 * Whether the camera is pinned to the player, and the ways back to them (BRDC-MAP-004).
 *
 * The camera follows every GPS fix by default. A hand pan — a `dragstart` carrying a real
 * `originalEvent`, which a programmatic `easeTo`/`flyTo` never has — breaks the pin.
 * `recenter` restores it; `focusHere` also drops the zoom back to walking level and
 * flashes the cell underfoot, and is what the "Here" button calls.
 */
import { useCallback, useEffect, useState } from 'react';
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

  // Follow every fix while pinned. easeTo, not jumpTo: a hard cut on every fix reads as a
  // stutter while walking.
  useEffect(() => {
    if (!map || !ready || !position || !following || touring) return;
    map.easeTo({ center: [position.lng, position.lat], duration: 900 });
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
    if (map && position) {
      map.flyTo({ center: [position.lng, position.lat], duration: 500, essential: true });
    }
  }, [map, position]);

  const focusHere = useCallback(() => {
    setFollowing(true);
    if (!map || !position) return;
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
