/**
 * Kingdoms retired on this device, read when the page opens (BRDC-HALL-001).
 *
 * A ledger you visit, not a live feed — it only changes when a kingdom is retired, and
 * that reloads the app anyway. One read of `getHallOfFame`, newest first.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, HallOfFameEntry } from '@es3/core';

export interface HallOfFame {
  entries: readonly HallOfFameEntry[];
  loading: boolean;
}

export function useHallOfFame(repository: GameRepository | null, open: boolean): HallOfFame {
  const [entries, setEntries] = useState<readonly HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!repository || !open) return;
    let alive = true;
    setLoading(true);
    void repository.getHallOfFame().then((list) => {
      if (!alive) return;
      setEntries([...list].reverse());
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [repository, open]);

  return { entries, loading };
}
