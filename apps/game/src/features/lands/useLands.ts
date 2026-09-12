/**
 * Every hex you hold, read when the page is opened (BRDC-LANDS-001).
 *
 * Not polled: it is a ledger you visit, and it changes when you walk, not while you read
 * it. One pass over `getOwnedCells` and `getRevealed`, sorted by `sortHoldings`.
 *
 * BRDC-LANDS-002 adds the one thing the ledger could say to do but not do: revealing. A
 * reveal updates its own row **in place** rather than re-reading the list — the order is
 * the page's whole opinion (unrevealed first), and re-sorting under a thumb that is
 * working down the list would move the next row out from under it.
 */
import { useCallback, useEffect, useState } from 'react';
import { holdingOf, sortHoldings, summarise } from '@es3/core';
import type { Collected, GameRepository, Holding, HoldingsSummary, WonderId } from '@es3/core';

/** What one reveal turned up, for the row that asked. */
export interface Revealed {
  h3: string;
  tier: string;
  bonus: Partial<Record<string, number>>;
}

export interface Lands {
  list: readonly Holding[];
  summary: HoldingsSummary;
  loading: boolean;
  /** Reveal a held hex without leaving the page. */
  reveal: (h3: string) => void;
  /** Hexes revealed from this page, so a row can say what it turned up. */
  found: Readonly<Record<string, Revealed>>;
  /** The last payout, shaped for the same toast and pling a map reveal uses. */
  gain: Collected | null;
  /**
   * A wonder this page's reveal turned up (BRDC-WONDER-001).
   *
   * Revealing from the ledger reaches any hex you hold, not just the one underfoot, so a
   * wonder can absolutely be found from here — and finding one in silence because the
   * moment lives on another screen would be the worst possible place to be inconsistent.
   */
  wonder: WonderId | null;
  clearWonder: () => void;
}

const NONE: HoldingsSummary = { total: 0, unrevealed: 0, works: 0, fading: 0 };

export function useLands(repository: GameRepository | null, open: boolean, now: () => number): Lands {
  const [list, setList] = useState<readonly Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<Readonly<Record<string, Revealed>>>({});
  const [gain, setGain] = useState<Collected | null>(null);
  const [wonder, setWonder] = useState<WonderId | null>(null);
  const clearWonder = useCallback(() => setWonder(null), []);

  useEffect(() => {
    if (!repository || !open) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      const [cells, revealed, home] = await Promise.all([
        repository.getOwnedCells(now()),
        repository.getRevealed(),
        repository.getHome(),
      ]);
      if (!alive) return;
      setList(sortHoldings(cells.map((c) => holdingOf(c, revealed, home))));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [repository, open, now]);

  const reveal = useCallback(
    (h3: string) => {
      if (!repository) return;
      const at = now();
      // Marked revealed before the write lands, so the button leaves under the thumb and
      // cannot be pressed twice. `revealCell` refuses a second one regardless.
      setList((rows) => rows.map((r) => (r.h3 === h3 ? { ...r, revealed: true } : r)));

      void repository.revealCell(h3, at).then((r) => {
        if (!r.ok) return;
        setFound((all) => ({ ...all, [h3]: { h3, tier: r.tier, bonus: r.bonus } }));
        const total = Object.values(r.bonus).reduce((sum, n) => sum + n, 0);
        // `hours: 0` — a reveal is a find, not a wait being cashed in. Same shape Collect
        // uses, so one toast serves both (BRDC-UI-002).
        if (total > 0) setGain({ delta: r.bonus, total, hours: 0, at });
        if (r.wonder) setWonder(r.wonder);
      });
    },
    [repository, now],
  );

  return {
    list,
    summary: list.length > 0 ? summarise(list) : NONE,
    loading,
    reveal,
    found,
    gain,
    wonder,
    clearWonder,
  };
}
