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
import type {
  CaptureOutcome,
  Collected,
  GameRepository,
  H3Index,
  StepClaimOutcome,
  WonderId,
} from '@es3/core';

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
  /** What the last reveal paid, shaped for `PouchGain` — the toast and the pling. */
  revealGain: Collected | null;
  /** A wonder this reveal turned up (BRDC-WONDER-001). Null on all but one reveal ever. */
  wonderFound: WonderId | null;
  /** Dismiss the wonder card. The find itself is already written and permanent. */
  clearWonder: () => void;
}

export function useDiscovery(
  repository: GameRepository | null,
  standingOn: H3Index | null,
  now: () => number,
  loopClosure: boolean,
  /** Called after a claim or a reveal, so the HUD re-reads the pouch and profile. */
  onChanged: () => void,
  /**
   * Called with what the step actually took (BRDC-CLAIM-013), so the claim can be
   * announced. `onChanged` re-reads state; this one reports the event.
   */
  onClaimed?: (outcome: CaptureOutcome, h3: H3Index) => void,
): DiscoveryState {
  const [discovered, setDiscovered] = useState<Discovery | null>(null);
  const [revealed, setRevealed] = useState<Record<H3Index, number>>({});
  const [revealGain, setRevealGain] = useState<Collected | null>(null);
  /** The wonder this reveal turned up, until it is dismissed. Null almost always. */
  const [wonderFound, setWonderFound] = useState<WonderId | null>(null);
  const clearWonder = useCallback(() => setWonderFound(null), []);
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
      // Announce before the dedupe: `claimed` guards the *discovery card*, and the ground
      // was genuinely taken whether or not this cell has been carded before. `onChanged`
      // below still does the re-reads — routing them through the claim event instead costs
      // a render, and territory arriving a tick late breaks the reveal on the hex just
      // taken (BRDC-CLAIM-013, `step-claim.spec.ts:142`).
      if (r.claimed) onClaimed?.(r.outcome, r.claimed);
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

  /*
   * Revealing paid into the pouch and said nothing whatsoever — no line, no sound, no
   * number. The button changed into a sentence about the tier and that was the whole of
   * it, so "nothing happened" was a fair reading of what the player saw.
   *
   * The payout is handed to `PouchGain` in the shape Collect already uses, so the two
   * actions that put resources in the pouch look and sound the same (claude.md §14: same
   * action, same appearance). `hours: 0` — a reveal is not a wait being cashed in.
   */
  const onReveal = useCallback(
    (h3: H3Index) => {
      if (!repository) return;
      const at = now();
      void repository.revealCell(h3, at).then((r) => {
        if (!r.ok) return;
        const total = Object.values(r.bonus).reduce((sum, n) => sum + n, 0);
        if (total > 0) setRevealGain({ delta: r.bonus, total, hours: 0, at });
        // Looking closely is how a wonder is found (BRDC-WONDER-001). Almost every reveal
        // carries nothing here; the one that does is the largest event in the game.
        if (r.wonder) setWonderFound(r.wonder);
        refreshRevealed();
        onChanged();
      });
    },
    [repository, refreshRevealed, onChanged, now],
  );

  return { discovered, revealed, onReveal, revealGain, wonderFound, clearWonder };
}
