/**
 * Territory state: what is owned, and what a closed loop just did.
 *
 * Loop closure is attempted after every accepted batch rather than on a timer. A player
 * who has just walked the last few metres of a lap should see it fill immediately —
 * waiting ten seconds for the next tick would make the game feel broken at the exact
 * moment it is supposed to feel good.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { bearing, cellAreaM2, cellBoundary, hoursUntilReleased, totalAreaM2 } from '@es3/core';
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
  /** Cells within FADING_WARNING_HOURS of being reclaimed. */
  fading: number;
  /** Hours until the first of them goes, or null if nothing is close. */
  fadingInHours: number | null;
  released: string[];
  /** Bearing from the player to the nearest rival ground, or null if there is none. */
  rivalBearing: number | null;
  refresh: () => Promise<void>;
}

export interface UseTerritoryOptions {
  repository: GameRepository | null;
  /** Where the player is, for working out which way the rivals are. */
  position?: { lat: number; lng: number } | null;
  runId: RunId | null;
  /** Bumped whenever the trail changes, to trigger a closure attempt. */
  trailVersion: number;
  bbox: BBox | null;
  now: () => number;
  /** The Hearth cell — it never fades, so it is left out of the fade warning. */
  home?: string | null;
  /** Attempt loop closure at all. Off by default now — territory grows by stepping (BRDC-CLAIM-009). */
  loopClosure?: boolean;
}

export function useTerritory({
  repository,
  runId,
  trailVersion,
  bbox,
  now,
  position = null,
  home = null,
  loopClosure = false,
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
   * Read in the ground that is already held.
   *
   * With the loop off (the default since BRDC-CLAIM-009) `attempt()` returns before it
   * reaches its `refresh()`, so nothing loaded existing territory on its own — a returning
   * player's whole map, or a fresh player's Hearth ring, stayed invisible until the first
   * step-claim happened to call `refresh()` through its HUD sync. This re-reads whenever
   * the viewport, the Hearth or the run changes; `refresh` itself no-ops without a bbox.
   */
  useEffect(() => {
    void refresh();
  }, [refresh, home, runId]);

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
    if (!repository || !runId || !loopClosure) return;

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
  }, [repository, runId, refresh, now, loopClosure]);

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

  /*
   * What is about to be lost.
   *
   * The core loop is "walk the same routes regularly". A player who only discovers a
   * loss after it has happened does not go back for it; one told on Thursday that
   * Saturday's route is fading goes for a walk. This is the single most useful number
   * in the HUD once someone holds any ground at all.
   */
  const at = now();
  let fadingInHours: number | null = null;
  let fading = 0;

  for (const cell of owned) {
    if (cell.h3 === home) continue; // the Hearth cannot fade (BRDC-HEARTH-002)
    const elapsed = (at - cell.lastVisitedAt) / 3_600_000;
    const remaining = hoursUntilReleased(cell.strength) - elapsed;
    if (remaining <= FADING_WARNING_HOURS) {
      fading++;
      if (fadingInHours === null || remaining < fadingInHours) fadingInHours = remaining;
    }
  }

  return {
    cells,
    owned,
    rivalBearing: nearestRivalBearing(cells, owned, position),
    ownedAreaM2: totalAreaM2(owned.map((c) => c.h3)),
    strongest: owned.reduce((max, c) => Math.max(max, c.strength), 0),
    lastClaim,
    fading,
    fadingInHours,
    released,
    refresh,
  };
}

/** Which way the nearest ground somebody else holds actually lies. */
function nearestRivalBearing(
  cells: readonly Cell[],
  owned: readonly Cell[],
  position: { lat: number; lng: number } | null,
): number | null {
  if (!position) return null;
  const mine = new Set(owned.map((c) => c.h3));

  let best: { bearing: number; distance: number } | null = null;
  for (const cell of cells) {
    if (cell.ownerId === null || mine.has(cell.h3)) continue;
    const ring = cellBoundary(cell.h3);
    const first = ring[0];
    if (!first) continue;
    const centre = { lat: first[1], lng: first[0] };
    const distance = Math.hypot(centre.lat - position.lat, centre.lng - position.lng);
    if (!best || distance < best.distance) {
      best = { bearing: bearing(position, centre), distance };
    }
  }
  return best?.bearing ?? null;
}

/**
 * How much notice a player gets.
 *
 * Two days: long enough to fit a walk into a week, short enough that the warning still
 * means something when it appears.
 */
export const FADING_WARNING_HOURS = 48;

/** Area of a single cell, for callers that need one rather than a set. */
export { cellAreaM2 };
