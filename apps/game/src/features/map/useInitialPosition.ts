/**
 * One-shot position, used only to decide where to open the camera.
 *
 * Continuous tracking is BRDC-TRAIL-001. This is the map's own question — "where am
 * I looking?" — and it is asked once, so a slow or refused fix never blocks the map
 * from appearing.
 *
 * BRDC-GEO-001: it must not be *able* to block the map, and it was. `getCurrentPosition`
 * is allowed to call neither callback, and on iOS it routinely does exactly that — the
 * spec's own `timeout` clock does not start until permission has been granted, so a
 * prompt nobody answers, Location Services switched off for Safari, or Lockdown Mode all
 * leave both callbacks unfired forever. `settled` then never turned true, `MapView` stayed
 * on "Listening for the ground beneath you…", and because tracking is gated on `settled`
 * there was no second chance either. One unanswered browser callback bricked the game.
 *
 * So there is a deadline of our own now. The browser is asked politely; if it has not
 * answered by `timeoutMs`, we settle without it and the map opens.
 */
import { useEffect, useState } from 'react';
import type { LatLng } from '@es3/core';

/** Statue of the Boy, Tampere. Where v2's quest began, and a defensible default. */
export const FALLBACK_CENTRE: LatLng = {
  lat: 61.47290805294704,
  lng: 23.725882485862012,
};

export type PermissionState =
  | 'pending'
  | 'granted'
  | 'denied'
  | 'unavailable'
  /** Asked, and the browser never answered either way. Not the same as "no sensor". */
  | 'timed-out';

export interface InitialPosition {
  centre: LatLng;
  /** True once we know the answer, either way. The map waits for this, briefly. */
  settled: boolean;
  permission: PermissionState;
}

/**
 * What a geolocation error means for the camera, as a value (BRDC-GEO-001).
 *
 * Pure and exported so the distinction is tested without a browser. A TIMEOUT is kept
 * apart from POSITION_UNAVAILABLE deliberately: "no location sensor on this device" is
 * simply false about a phone that was too slow to get a fix, and it sends the player
 * looking for the wrong problem.
 */
export function permissionFor(err: GeolocationPositionError): PermissionState {
  if (err.code === err.PERMISSION_DENIED) return 'denied';
  if (err.code === err.TIMEOUT) return 'timed-out';
  return 'unavailable';
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
    let answered = false;

    /*
     * Our own deadline, because the browser's is not guaranteed to arrive. A little
     * longer than the one we hand the browser, so its answer wins whenever it comes.
     */
    const deadline = setTimeout(() => {
      if (cancelled || answered) return;
      setState({ centre: FALLBACK_CENTRE, settled: true, permission: 'timed-out' });
    }, timeoutMs + 1_000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        answered = true;
        if (cancelled) return;
        setState({
          centre: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          settled: true,
          permission: 'granted',
        });
      },
      (err) => {
        answered = true;
        if (cancelled) return;
        // A refusal is a decision, not a crash. The map opens on the fallback and the
        // HUD says why — v2 failed silently here and players thought it had frozen.
        setState({ centre: FALLBACK_CENTRE, settled: true, permission: permissionFor(err) });
      },
      // maximumAge is a minute here, not zero: this hook only answers "where does the
      // camera open?". A fix from a minute ago is far better than the Tampere fallback,
      // and a cold high-accuracy fix routinely outruns the timeout. Tracking keeps its
      // own `maximumAge: 0` (usePositionSource) — there a stale fix would be read as
      // movement and draw a ley-line nobody walked.
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );

    return () => {
      cancelled = true;
      clearTimeout(deadline);
    };
  }, [timeoutMs]);

  return state;
}
