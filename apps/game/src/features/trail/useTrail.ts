/**
 * The ley-line: run lifecycle, batching, and persistence.
 *
 * Fixes are buffered and submitted every TRAIL_BATCH_MS. One write per GPS tick would
 * flatten a battery over an hour's walk, and every write goes through the repository
 * so validation happens in exactly one place — the same place the server will do it
 * in Phase 3.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { TRAIL_BATCH_MS } from '@es3/core';
import type {
  GameRepository,
  RejectReason,
  RevealedPlace,
  RunId,
  TrailPoint,
  WalkedEdge,
} from '@es3/core';
import { keepIfSame } from '../map/keepIfSame.js';

export interface TrailState {
  runId: RunId | null;
  points: TrailPoint[];
  distanceM: number;
  /** Why the most recent batch dropped fixes, if it did. Drives the HUD. */
  lastRejection: RejectReason | null;
  /**
   * Time this run spent with the page frozen, and therefore blind.
   *
   * Kept because it is the honest answer to "why is my border wrong": nothing was
   * recorded for these minutes, and the Vigil is what prevents them.
   */
  unobservedMs: number;
  /** Places that named themselves in the most recent batch. Drives the reveal. */
  revealed: RevealedPlace[];
  /** Every stretch ever walked, thickening with use — outlives the run (BRDC-TRAIL-003). */
  walkedPaths: WalkedEdge[];
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
  /** How often the buffer is written. A route played back at ×60 flushes every second, so
   *  the line and the claims are watched growing rather than jumping (BRDC-SIM-002). */
  batchMs?: number | undefined;
  /** A played-back route's way in (BRDC-SIM-003): `feed` hands points straight to the
   *  buffer, without a render each; `settle` writes what is buffered and waits for it, so
   *  an action runs on ground already claimed. */
  link?: MutableRefObject<TrailLink | null> | undefined;
  /** A recorded walk being played (BRDC-GPX-005): its batches take their own path, with
   *  no need to touch ground already held. Never set for a live walk. */
  standalone?: boolean | undefined;
}

export interface TrailLink {
  feed: (p: TrailPoint) => void;
  settle: () => Promise<void>;
  newRun: () => Promise<void>;
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

export function useTrail({ repository, point, collecting, batchMs = TRAIL_BATCH_MS, link, standalone = false }: UseTrailOptions): TrailState {
  const [state, setState] = useState<TrailState>({
    runId: null,
    points: [],
    distanceM: 0,
    lastRejection: null,
    unobservedMs: 0,
    revealed: [],
    walkedPaths: [],
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
      const walkedPaths = await repository.getWalkedPaths();
      if (cancelled) return;

      runIdRef.current = runId;
      setState({
        runId,
        points,
        distanceM: existing?.distanceM ?? 0,
        lastRejection: null,
        unobservedMs: 0,
        revealed: [],
        walkedPaths,
        ready: true,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [repository]);

  /*
   * Buffer incoming fixes, each once and in order. Guards against React re-delivering the
   * same fix on re-render, and against a played-back point arriving twice — fed directly
   * and then shown as the position.
   */
  const lastT = useRef<number | null>(null);
  const take = useCallback((p: TrailPoint) => {
    if (lastT.current !== null && p.t <= lastT.current) return;
    buffer.current.push(p);
    lastT.current = p.t;
  }, []);
  useEffect(() => {
    if (point && collecting) take(point);
  }, [point, collecting, take]);

  /*
   * One write at a time (found by BRDC-SIM-003's playback). `submitTrail` reads the run's
   * trail and writes it back with the batch, and a claim needs the ground before it to be
   * written — so two flushes in flight lost points (the last write won) and broke the run
   * of claims (the second batch's first hex did not yet border the first's). A slow write
   * on a big save could do it at the ten-second pace too. The buffer is still taken at
   * once; only the writing waits its turn.
   */
  const queue = useRef<Promise<void>>(Promise.resolve());
  const flush = useCallback((): Promise<void> => {
    const runId = runIdRef.current;
    if (!repository || !runId || buffer.current.length === 0) return queue.current;

    const batch = buffer.current;
    buffer.current = [];

    queue.current = queue.current.then(async () => {
      const result = await repository.submitTrail(runId, batch, standalone ? { standalone: true } : undefined);
      const points = await repository.getTrailPoints(runId);
      // The batch just wore the walked-path store; re-read so the layer thickens live.
      const walkedPaths = await repository.getWalkedPaths();

      setState((s) => ({
        ...s,
        points,
        walkedPaths,
        distanceM: s.distanceM + result.distanceM,
        lastRejection: actionableRejection(result.rejected),
        unobservedMs: s.unobservedMs + result.unobservedMs,
        // Replaced, not appended: this is "what is news right now", and an empty batch
        // clearing it is what lets the reveal fire again for the next place.
        revealed: keepIfSame(s.revealed, result.revealed),
      }));
    }).catch((e: unknown) => {
      // That batch is lost, as it was before the queue; the writes after it must not be.
      console.error('trail write failed', e);
    });
    return queue.current;
  }, [repository, standalone]);


  /*
   * End this run and open a fresh one — a route played back begins one and its end begins
   * another, so neither jump (to the route's start, back to where the phone is) reads as a
   * teleport (BRDC-SIM-002). Awaited by the caller: a point fed before the new run is open
   * would go to the old one, behind its last fix, and be thrown away.
   */
  const newRun = useCallback(async () => {
    if (!repository) return;
    const old = runIdRef.current;
    // `flush` takes the buffer before its first await, so only what came before the
    // switch goes to the old run; with no run id, the timer holds the rest until the new
    // one opens. A new run is a new clock: a route lies in the past of the last live fix.
    const flushed = flush();
    runIdRef.current = null;
    lastT.current = null;
    await flushed;
    if (old) await repository.endRun(old);
    const runId = await repository.startRun(Date.now());
    runIdRef.current = runId;
    setState((s) => ({ ...s, runId, points: [], distanceM: 0, lastRejection: null, revealed: [] }));
  }, [repository, flush]);

  useEffect(() => {
    if (!link) return;
    link.current = { feed: take, settle: flush, newRun };
    return () => {
      link.current = null;
    };
  }, [link, take, flush, newRun]);

  /* Flush on a timer. */
  useEffect(() => {
    if (!state.ready || !collecting) return;
    const timer = setInterval(() => void flush(), batchMs);
    return () => clearInterval(timer);
  }, [state.ready, collecting, flush, batchMs]);

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
