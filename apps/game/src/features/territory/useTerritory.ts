/**
 * Territory state: what is owned, and what a closed loop just did.
 *
 * Loop closure is attempted after every accepted batch rather than on a timer. A player
 * who has just walked the last few metres of a lap should see it fill immediately —
 * waiting ten seconds for the next tick would make the game feel broken at the exact
 * moment it is supposed to feel good.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cellAreaM2, totalAreaM2 } from '@es3/core';
import type { BBox, CaptureOutcome, Cell, GameRepository, RunId } from '@es3/core';

export interface ClaimEvent {
  outcomes: CaptureOutcome[];
  areaM2: number;
  at: number;
}

export interface TerritoryState {
  cells: Cell[];
  owned: Cell[];
  /** Measured from the cells themselves, never from the nominal cell area. */
  ownedAreaM2: number;
  strongest: number;
  /** The most recent closure, for the HUD to announce. */
  lastClaim: ClaimEvent | null;
  released: string[];
  refresh: () => Promise<void>;
}

export interface UseTerritoryOptions {
  repository: GameRepository | null;
  runId: RunId | null;
  /** Bumped whenever the trail changes, to trigger a closure attempt. */
  trailVersion: number;
  bbox: BBox | null;
  now: () => number;
}

export function useTerritory({
  repository,
  runId,
  trailVersion,
  bbox,
  now,
}: UseTerritoryOptions): TerritoryState {
  const [cells, setCells] = useState<Cell[]>([]);
  const [owned, setOwned] = useState<Cell[]>([]);
  const [lastClaim, setLastClaim] = useState<ClaimEvent | null>(null);
  const [released, setReleased] = useState<string[]>([]);
  // A closure attempt writes, so two must never overlap — but a second attempt that
  // arrives mid-flight must not simply be dropped either. `queued` is the difference
  // between serialising the work and losing it.
  const busy = useRef(false);
  const queued = useRef(false);

  const refresh = useCallback(async () => {
    if (!repository || !bbox) return;
    const at = now();
    setCells(await repository.getCells(bbox, at));
    setOwned(await repository.getOwnedCells(at));
  }, [repository, bbox, now]);

  /*
   * Try to close after each batch.
   *
   * Two mistakes were made here in a row, and both lost a completed lap silently.
   *
   * The first returned early while an attempt was in flight, throwing that attempt
   * away: when the collision landed on the last batch of a walk, `trailVersion` never
   * changed again and the lap was never claimed.
   *
   * The second cancelled in-flight attempts on cleanup. But `closeLoop` has already
   * written by the time it resolves — so cancelling did not undo the claim, it only
   * discarded the news of it. The ground was taken, XP was paid, and the HUD went on
   * showing zero. Nothing in the interface hinted that anything had happened.
   *
   * So: attempts are serialised, never dropped, and only a real unmount stops the
   * result reaching the screen.
   */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const attempt = useCallback(async (): Promise<void> => {
    if (!repository || !runId) return;

    if (busy.current) {
      queued.current = true;
      return;
    }
    busy.current = true;

    try {
      const at = now();
      const result = await repository.closeLoop(runId, at);
      if (result.closed && mounted.current) {
        setLastClaim({ outcomes: result.outcomes, areaM2: result.areaM2, at });
      }
      if (mounted.current) await refresh();
    } finally {
      busy.current = false;
    }

    if (queued.current) {
      queued.current = false;
      await attempt();
    }
  }, [repository, runId, refresh, now]);

  useEffect(() => {
    void attempt();
  }, [attempt, trailVersion]);

  // A separate sweep so ground rots even on a walk that never closes anything.
  useEffect(() => {
    if (!repository) return;
    void (async () => {
      const sweep = await repository.runDecay(now());
      if (sweep.released.length > 0) {
        setReleased(sweep.released);
        await refresh();
      }
    })();
  }, [repository, trailVersion, refresh, now]);

  return {
    cells,
    owned,
    ownedAreaM2: totalAreaM2(owned.map((c) => c.h3)),
    strongest: owned.reduce((max, c) => Math.max(max, c.strength), 0),
    lastClaim,
    released,
    refresh,
  };
}

/** Area of a single cell, for callers that need one rather than a set. */
export { cellAreaM2 };
