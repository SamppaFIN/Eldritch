/**
 * Hold a watch open until the device knows where it is.
 *
 * Deliberately not `usePositionSource`: that one is downsampled, filtered and shaped for
 * drawing a ley-line. This wants every raw fix the device will give, because the whole
 * question is how the fixes behave over the first half-minute.
 */
import { useEffect, useRef, useState } from 'react';
import type { TrailPoint } from '@es3/core';
import { assess } from './acquisition.js';
import type { Acquisition } from './acquisition.js';

export type AcquireStatus = 'acquiring' | 'denied' | 'unavailable';

export interface AcquireState extends Acquisition {
  status: AcquireStatus;
  /** Seconds spent waiting. The screen offers a way past after long enough. */
  elapsedS: number;
}

/** More than this and the oldest fixes say nothing about where the player is now. */
const KEEP = 12;

export function useAcquireFix(): AcquireState {
  const [samples, setSamples] = useState<TrailPoint[]>([]);
  const [status, setStatus] = useState<AcquireStatus>('acquiring');
  const [elapsedS, setElapsedS] = useState(0);
  const started = useRef(Date.now());

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setSamples((prev) =>
          [
            ...prev,
            {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              t: pos.timestamp,
              accuracy: pos.coords.accuracy,
            },
          ].slice(-KEEP),
        );
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      // maximumAge 0: a cached fix from the last time the phone was somewhere else is
      // precisely the thing that would hand out the wrong Hearth.
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    );

    const tick = setInterval(() => {
      setElapsedS(Math.round((Date.now() - started.current) / 1000));
    }, 1_000);

    return () => {
      navigator.geolocation.clearWatch(id);
      clearInterval(tick);
    };
  }, []);

  return { ...assess(samples), status, elapsedS };
}
