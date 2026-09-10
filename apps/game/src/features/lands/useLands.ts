/**
 * Every hex you hold, read when the page is opened (BRDC-LANDS-001).
 *
 * Not polled: it is a ledger you visit, and it changes when you walk, not while you read
 * it. One pass over `getOwnedCells` and `getRevealed`, sorted by `sortHoldings`.
 */
import { useEffect, useState } from 'react';
import { holdingOf, sortHoldings, summarise } from '@es3/core';
import type { GameRepository, Holding, HoldingsSummary } from '@es3/core';

export interface Lands {
  list: readonly Holding[];
  summary: HoldingsSummary;
  loading: boolean;
}

const NONE: HoldingsSummary = { total: 0, unrevealed: 0, works: 0, fading: 0 };

export function useLands(repository: GameRepository | null, open: boolean, now: () => number): Lands {
  const [list, setList] = useState<readonly Holding[]>([]);
  const [loading, setLoading] = useState(false);

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

  return { list, summary: list.length > 0 ? summarise(list) : NONE, loading };
}
