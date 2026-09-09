/**
 * The Keep's Mana tab: the Altar's level and rate, and the one verb (BRDC-KEEP-002).
 *
 * Mirrors `useAdventure` / `useAnomaly` — its own fetch, its own refusal string, one
 * binding back. The Altar *is* the Anchor: its level is the Anchor place's `expansion`,
 * its rate the Anchor's `manaPerHour` — which it now also pays in wisdom
 * (PIVOT-2026-09-09 P3, so channelling is gone). Raising settles the pouch server-side,
 * so it refetches and calls `afterSpend` to refresh the panels around it.
 */
import { useCallback, useEffect, useState } from 'react';
import { MAX_TEMPLE_EXPANSION } from '@es3/core';
import type { GameRepository } from '@es3/core';

export interface KeepEconomy {
  altarLevel: number;
  altarManaPerHour: number;
  atMax: boolean;
  refusal: string | null;
  onRaiseAltar: () => void;
}

export function useKeepEconomy(
  repository: GameRepository | null,
  now: () => number,
  version: number,
  afterSpend: () => void,
): KeepEconomy {
  const [altarLevel, setLevel] = useState(0);
  const [altarManaPerHour, setRate] = useState(0);
  const [refusal, setRefusal] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!repository) return;
    const anchor = (await repository.getPlaces()).find((p) => p.kind === 'anchor');
    setLevel(anchor?.expansion ?? 0);
    setRate(anchor?.manaPerHour ?? 0);
  }, [repository]);

  useEffect(() => {
    void refetch();
  }, [refetch, version]);

  const run = useCallback(
    (act: () => Promise<{ ok: boolean; refused?: string }>) => {
      void (async () => {
        const r = await act();
        setRefusal(r.ok ? null : (r.refused ?? 'refused'));
        await refetch();
        afterSpend();
      })();
    },
    [refetch, afterSpend],
  );

  return {
    altarLevel,
    altarManaPerHour,
    atMax: altarLevel >= MAX_TEMPLE_EXPANSION,
    refusal,
    onRaiseAltar: () => repository && run(() => repository.raiseAltar(now())),
  };
}
