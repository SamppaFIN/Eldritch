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
import type { GameRepository, H3Index } from '@es3/core';

export interface Discovery {
  h3: H3Index;
  at: number;
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

  const refreshRevealed = useCallback(() => {
    void repository?.getRevealed().then(setRevealed);
  }, [repository]);
  useEffect(refreshRevealed, [refreshRevealed]);

  useEffect(() => {
    if (loopClosure || !repository || !standingOn || claimed.current.has(standingOn)) return;
    let alive = true;
    void repository.claimStep(standingOn, now()).then((r) => {
      if (!alive || !r.claimed) return;
      claimed.current.add(r.claimed);
      setDiscovered({ h3: r.claimed, at: now() });
      onChanged();
    });
    return () => {
      alive = false;
    };
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
