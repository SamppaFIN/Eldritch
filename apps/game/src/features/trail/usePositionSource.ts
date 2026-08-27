/**
 * Where positions come from.
 *
 * Two sources behind one shape: the device, and — in dev builds only — the keyboard.
 * A territory game cannot be developed if every change costs a walk around the block,
 * but the simulated source must never reach a player, so it is compiled out.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { destination } from '@es3/core';
import type { LatLng, TrailPoint } from '@es3/core';

export type PositionSource = 'device' | 'simulated';

export type GeoStatus =
  | 'idle'
  | 'pending'
  /** Fixes are arriving. */
  | 'tracking'
  /** The player said no. A decision, not a fault. */
  | 'denied'
  /** No sensor, or the browser will not give us one. */
  | 'unavailable'
  /** Permission is fine but no fix has arrived — indoors, tunnel, cold start. */
  | 'searching';

export interface PositionState {
  point: TrailPoint | null;
  status: GeoStatus;
  source: PositionSource;
}

/** Walking pace, applied per keypress-step in the simulated source. */
const SIM_STEP_M = 8;
const SIM_TICK_MS = 5_000;

export interface UsePositionSourceOptions {
  enabled: boolean;
  /** Start position for the simulated source. */
  origin: LatLng;
  /** Dev only. Ignored entirely in a production build. */
  simulate?: boolean;
}

export function usePositionSource({
  enabled,
  origin,
  simulate = false,
}: UsePositionSourceOptions): PositionState {
  const [state, setState] = useState<PositionState>({
    point: null,
    status: 'idle',
    source: 'device',
  });

  const useSim = import.meta.env.DEV && simulate;

  /* --- Device ----------------------------------------------------------- */

  useEffect(() => {
    if (!enabled || useSim) return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ point: null, status: 'unavailable', source: 'device' });
      return;
    }

    setState((s) => ({ ...s, status: 'pending', source: 'device' }));

    // A fix can take half a minute on a cold start under trees. The HUD says
    // "searching" rather than leaving the player looking at a still screen —
    // v2 showed nothing here and people concluded the game had frozen.
    const searching = setTimeout(() => {
      setState((s) => (s.status === 'pending' ? { ...s, status: 'searching' } : s));
    }, 4_000);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          point: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            t: pos.timestamp,
            accuracy: pos.coords.accuracy,
          },
          status: 'tracking',
          source: 'device',
        });
      },
      (err) => {
        setState({
          point: null,
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable',
          source: 'device',
        });
      },
      // maximumAge 0: a cached fix from an hour ago is worse than no fix, because
      // it would be accepted as movement and draw a line the player never walked.
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    );

    return () => {
      clearTimeout(searching);
      navigator.geolocation.clearWatch(id);
    };
  }, [enabled, useSim]);

  /* --- Simulated (dev only) --------------------------------------------- */

  const heading = useRef(0);
  const walking = useRef(false);
  const positionRef = useRef<LatLng>(origin);

  const step = useCallback((bearingDeg: number) => {
    heading.current = bearingDeg;
    walking.current = true;
  }, []);

  useEffect(() => {
    if (!enabled || !useSim) return;

    positionRef.current = origin;
    setState({
      point: { ...origin, t: Date.now(), accuracy: 6 },
      status: 'tracking',
      source: 'simulated',
    });

    const onKey = (e: KeyboardEvent) => {
      const bearing = { w: 0, d: 90, s: 180, a: 270 }[e.key.toLowerCase()];
      if (bearing === undefined) return;
      e.preventDefault();
      step(bearing);
    };
    const onKeyUp = () => {
      walking.current = false;
    };

    // Emitting on the same cadence as MIN_POINT_INTERVAL_MS keeps simulated walks
    // subject to exactly the filtering a real one gets.
    const tick = setInterval(() => {
      if (!walking.current) return;
      positionRef.current = destination(positionRef.current, heading.current, SIM_STEP_M);
      setState({
        point: { ...positionRef.current, t: Date.now(), accuracy: 6 },
        status: 'tracking',
        source: 'simulated',
      });
    }, SIM_TICK_MS);

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      clearInterval(tick);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [enabled, useSim, origin, step]);

  return state;
}
