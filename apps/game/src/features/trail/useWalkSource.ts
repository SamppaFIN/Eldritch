/**
 * Where the walk comes from: the phone, the dev keyboard walk (G, then WASD), or a route
 * played back (BRDC-SIM-002). One answer for the rest of the game, which never needs to
 * know which — the trail, the filter and the claims treat all three the same.
 */
import type { LatLng } from '@es3/core';
import { usePositionSource } from './usePositionSource.js';
import type { PositionState } from './usePositionSource.js';
import { useSimulateKey } from './useSimulateKey.js';
import { usePlayback } from '../playback/usePlayback.js';
import type { Playback } from '../playback/usePlayback.js';

export function useWalkSource(enabled: boolean, origin: LatLng): PositionState & { playback: Playback } {
  const simulate = useSimulateKey();
  const live = usePositionSource({ enabled, origin, simulate });
  const playback = usePlayback(live.point);
  if (playback.point) return { point: playback.point, status: 'tracking', source: 'playback', playback };
  return { ...live, playback };
}
