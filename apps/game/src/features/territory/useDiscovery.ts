/**
 * Finding new ground, and learning what it holds (BRDC-CLAIM-009).
 *
 * The loop is the game's real mechanic and it comes back behind a setting. Until then
 * territory grows a hex at a time: step onto unclaimed ground that borders yours and it
 * is taken (`claimStep` writes the pouch, XP and log itself). This hook is the trigger
 * plus the `revealed` bookkeeping the detail card and the modal both read.
 *
 * Consolidated into one hook so MapView, which is at its line ceiling, gains a single
 * call rather than three effects.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameRepository, H3Index, StepClaimOutcome } from '@es3/core';

export interface Discovery {
  h3: H3Index;
  at: number;
}

/**
 * The hex a finished step-claim should surface as "New ground", or `null`.
 *
 * A step-claim is a write that has already happened by the time its promise resolves, so
 * its outcome is committed unconditionally — never gated on an `alive` flag a re-fired
 * effect or a fast walk would have flipped, the way the loop path lost a claim twice
 * (see `useTerritory` and `claim.spec.ts`). Dedupe is by h3 (BRDC-CLAIM-011).
 */
export function nextDiscovery(result: StepClaimOutcome, seen: ReadonlySet<H3Index>): H3Index | null {
  return result.claimed && !seen.has(result.claimed) ? result.claimed : null;
}

export interface DiscoveryState {
  /** The last hex a step just claimed — drives the "New ground" modal and the map reveal. */
  discovered: Discovery | null;
  /** Cells the player has revealed → the ms they were revealed. */
  revealed: Readonly<Record<H3Index, number>>;
  /** Reveal a held cell for its tier bonus, once. */
  onReveal: (h3: H3Index) => void;
}

export function useDiscovery(
  repository: GameRepository | null,
  standingOn: H3Index | null,
  now: () => number,
  loopClosure: boolean,
  /** Called after a claim or a reveal, so the HUD re-reads the pouch and profile. */
  onChanged: () => void,
): DiscoveryState {
  const [discovered, setDiscovered] = useState<Discovery | null>(null);
  const [revealed, setRevealed] = useState<Record<H3Index, number>>({});
  const claimed = useRef<Set<H3Index>>(new Set());
  const inFlight = useRef<Set<H3Index>>(new Set());

  const refreshRevealed = useCallback(() => {
    void repository?.getRevealed().then(setRevealed);
  }, [repository]);
  useEffect(refreshRevealed, [refreshRevealed]);

  useEffect(() => {
    if (loopClosure || !repository || !standingOn) return;
    if (claimed.current.has(standingOn) || inFlight.current.has(standingOn)) return;
    const target = standingOn;
    inFlight.current.add(target);
    void repository.claimStep(target, now()).then((r) => {
      inFlight.current.delete(target);
      const found = nextDiscovery(r, claimed.current);
      if (!found) return;
      claimed.current.add(found);
      setDiscovered({ h3: found, at: now() });
      onChanged();
    });
    // No cleanup: the claim is written by the time this resolves, so cancelling on
    // cleanup would discard a real claim (the loop path's twice-made mistake). `claimed`
    // dedupes the result; `inFlight` keeps a re-fire or border jitter from a second call.
    // now / onChanged read fresh on fire; the real triggers are the cell and the mode.
  }, [repository, standingOn, loopClosure]);

  const onReveal = useCallback(
    (h3: H3Index) => {
      if (!repository) return;
      void repository.revealCell(h3, now()).then((r) => {
        if (!r.ok) return;
        refreshRevealed();
        onChanged();
      });
    },
    [repository, refreshRevealed, onChanged, now],
  );

  return { discovered, revealed, onReveal };
}
