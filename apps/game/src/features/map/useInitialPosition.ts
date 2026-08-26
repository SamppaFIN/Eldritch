/**
 * One-shot position, used only to decide where to open the camera.
 *
 * Continuous tracking is BRDC-TRAIL-001. This is the map's own question — "where am
 * I looking?" — and it is asked once, so a slow or refused fix never blocks the map
 * from appearing.
 */
import { useEffect, useState } from 'react';
import type { LatLng } from '@es3/core';

/** Statue of the Boy, Tampere. Where v2's quest began, and a defensible default. */
export const FALLBACK_CENTRE: LatLng = {
  lat: 61.47290805294704,
  lng: 23.725882485862012,
};

export type PermissionState = 'pending' | 'granted' | 'denied' | 'unavailable';

export interface InitialPosition {
  centre: LatLng;
  /** True once we know the answer, either way. The map waits for this, briefly. */
  settled: boolean;
  permission: PermissionState;
}

export function useInitialPosition(timeoutMs = 8_000): InitialPosition {
  const [state, setState] = useState<InitialPosition>({
    centre: FALLBACK_CENTRE,
    settled: false,
    permission: 'pending',
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ centre: FALLBACK_CENTRE, settled: true, permission: 'unavailable' });
      return;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setState({
          centre: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          settled: true,
          permission: 'granted',
        });
      },
      (err) => {
        if (cancelled) return;
        // A refusal is a decision, not a crash. The map opens on the fallback and the
        // HUD says why — v2 failed silently here and players thought it had frozen.
        setState({
          centre: FALLBACK_CENTRE,
          settled: true,
          permission: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable',
        });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );

    return () => {
      cancelled = true;
    };
  }, [timeoutMs]);

  return state;
}
