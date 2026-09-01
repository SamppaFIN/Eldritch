/**
 * The anomaly on the selected cell, and the three verbs for it (BRDC-EVENT-001).
 *
 * Lifted out of `useSelection` the way `useTradeRoutes` was — its own fetch, its own
 * state, one `binding` back. Investigate, look, and choose all pay or change the pouch,
 * so each runs `afterSpend` to refresh it.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Anomaly, GameRepository, H3Index } from '@es3/core';

export type AnomalyRefusal = string;

export interface AnomalyBinding {
  /** The anomaly on the selected cell, or `null`. */
  current: Anomaly | null;
  refusal: AnomalyRefusal | null;
  onInvestigate: () => void;
  onResolve: () => void;
  onChoose: (choiceIndex: number) => void;
}

export function useAnomaly(
  repository: GameRepository | null,
  selected: H3Index | null,
  now: () => number,
  trailVersion: number,
  afterSpend: () => Promise<void>,
): AnomalyBinding {
  const [all, setAll] = useState<readonly Anomaly[]>([]);
  const [refusal, setRefusal] = useState<AnomalyRefusal | null>(null);

  const refetch = useCallback(async () => {
    if (repository) setAll(await repository.getAnomalies(now()));
  }, [repository, now]);

  useEffect(() => {
    void refetch();
  }, [refetch, trailVersion]);

  useEffect(() => setRefusal(null), [selected]);

  const run = useCallback(
    (act: () => Promise<{ ok: boolean } & { refused?: string }>) => {
      void (async () => {
        const r = await act();
        setRefusal(r.ok ? null : (r.refused ?? 'refused'));
        await refetch();
        await afterSpend();
      })();
    },
    [refetch, afterSpend],
  );

  return {
    current: all.find((a) => a.h3 === selected) ?? null,
    refusal,
    onInvestigate: () => selected && repository && run(() => repository.investigateAnomaly(selected, now())),
    onResolve: () => selected && repository && run(() => repository.resolveAnomaly(selected, now())),
    onChoose: (i) => selected && repository && run(() => repository.chooseInChain(selected, i, now())),
  };
}
