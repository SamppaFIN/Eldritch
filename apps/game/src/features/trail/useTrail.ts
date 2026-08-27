/**
 * The ley-line: run lifecycle, batching, and persistence.
 *
 * Fixes are buffered and submitted every TRAIL_BATCH_MS. One write per GPS tick would
 * flatten a battery over an hour's walk, and every write goes through the repository
 * so validation happens in exactly one place — the same place the server will do it
 * in Phase 3.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TRAIL_BATCH_MS } from '@es3/core';
import type { GameRepository, RejectReason, RunId, TrailPoint } from '@es3/core';

export interface TrailState {
  runId: RunId | null;
  points: TrailPoint[];
  distanceM: number;
  /** Why the most recent batch dropped fixes, if it did. Drives the HUD. */
  lastRejection: RejectReason | null;
  /** True once an existing run has been restored or a new one opened. */
  ready: boolean;
}

export interface UseTrailOptions {
  /**
   * Null until the repository has been opened. Typed honestly rather than cast:
   * a `as GameRepository` here read as if the value were always present, and the
   * resume effect then called getActiveRun on null on the very first render.
   */
  repository: GameRepository | null;
  /** Latest fix, or null. Duplicates are harmless — the filter drops them. */
  point: TrailPoint | null;
  /** Set false to stop collecting without ending the run. */
  collecting: boolean;
}

/**
 * Which rejection, if any, is worth telling the player about.
 *
 * A device emits a fix roughly once a second while MIN_POINT_INTERVAL_MS is five, so
 * most of them are dropped as 'interval' on every single batch. That is the intended
 * downsampling — one point per ~7 m of walking — not a fault, and surfacing it would
 * park a permanent complaint in the HUD that the player can do nothing about.
 *
 * The rest are actionable: move somewhere with more sky, stop running, start moving.
 */
function actionableRejection(
  rejected: readonly { reason: RejectReason; count: number }[],
): RejectReason | null {
  const order: RejectReason[] = ['accuracy', 'speed', 'consolidated'];
  for (const reason of order) {
    if (rejected.some((r) => r.reason === reason)) return reason;
  }
  return null;
}

export function useTrail({ repository, point, collecting }: UseTrailOptions): TrailState {
  const [state, setState] = useState<TrailState>({
    runId: null,
    points: [],
    distanceM: 0,
    lastRejection: null,
    ready: false,
  });

  const buffer = useRef<TrailPoint[]>([]);
  const runIdRef = useRef<RunId | null>(null);

  /*
   * Resume, or begin.
   *
   * A reload mid-walk must continue the same run, not start a second one — otherwise a
   * loop closed after a reload would only cover half the ground actually walked.
   */
  useEffect(() => {
    if (!repository) return;
    let cancelled = false;

    void (async () => {
      const existing = await repository.getActiveRun();
      const runId = existing ? existing.id : await repository.startRun(Date.now());
      const points = existing ? await repository.getTrailPoints(runId) : [];
      if (cancelled) return;

      runIdRef.current = runId;
      setState({
        runId,
        points,
        distanceM: existing?.distanceM ?? 0,
        lastRejection: null,
        ready: true,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [repository]);

  /* Buffer incoming fixes. */
  useEffect(() => {
    if (!point || !collecting) return;
    const last = buffer.current[buffer.current.length - 1];
    // Guard against React re-delivering the same fix object on re-render.
    if (last && last.t === point.t) return;
    buffer.current.push(point);
  }, [point, collecting]);

  const flush = useCallback(async () => {
    const runId = runIdRef.current;
    if (!repository || !runId || buffer.current.length === 0) return;

    const batch = buffer.current;
    buffer.current = [];

    const result = await repository.submitTrail(runId, batch);
    const points = await repository.getTrailPoints(runId);

    setState((s) => ({
      ...s,
      points,
      distanceM: s.distanceM + result.distanceM,
      lastRejection: actionableRejection(result.rejected),
    }));
  }, [repository]);

  /* Flush on a timer. */
  useEffect(() => {
    if (!state.ready || !collecting) return;
    const timer = setInterval(() => void flush(), TRAIL_BATCH_MS);
    return () => clearInterval(timer);
  }, [state.ready, collecting, flush]);

  /*
   * Flush when the page goes away.
   *
   * `pagehide` rather than `beforeunload`: on mobile the browser suspends a backgrounded
   * tab without ever firing `beforeunload`, and up to ten seconds of walking would be
   * lost every time the player answered a message.
   */
  useEffect(() => {
    if (!state.ready) return;
    const onHide = () => void flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [state.ready, flush]);

  return state;
}
