/**
 * Where the walk comes from: the phone, the dev keyboard walk (G, then WASD), or a route
 * played back (BRDC-SIM-002). One answer for the rest of the game, which never needs to
 * know which — the trail, the filter and the claims treat all three the same.
 */
import { useCallback } from 'react';
import type { GameRepository, LatLng, TrailPoint } from '@es3/core';
import { usePositionSource } from './usePositionSource.js';
import type { PositionState } from './usePositionSource.js';
import { useSimulateKey } from './useSimulateKey.js';
import { usePlayback } from '../playback/usePlayback.js';
import type { Playback } from '../playback/usePlayback.js';
import { runAction } from '../playback/runAction.js';

export function useWalkSource(enabled: boolean, origin: LatLng, repository: GameRepository | null): PositionState & { playback: Playback } {
  const simulate = useSimulateKey();
  const live = usePositionSource({ enabled, origin, simulate });
  // A route's actions — begin a tale, build — run through the same repository verbs (BRDC-SIM-003).
  const act = useCallback(
    (action: string, at: TrailPoint) => (repository ? runAction(repository, action, at, Date.now()) : Promise.resolve({ line: `✗ ${action}: no game yet` })),
    [repository],
  );
  const playback = usePlayback(live.point, act);
  if (playback.point) return { point: playback.point, status: 'tracking', source: 'playback', playback };
  return { ...live, playback };
}
