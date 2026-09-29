/**
 * The anomaly on the selected cell, and the three verbs for it (BRDC-EVENT-001).
 *
 * Lifted out of `useSelection` — its own fetch, its own state, one `binding` back. Investigate, look, and choose all pay or change the pouch,
 * so each runs `afterSpend` to refresh it.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Anomaly, GameRepository, H3Index, ResourcePool } from '@es3/core';

export type AnomalyRefusal = string;

/** What an anomaly just gave up — kept after it is spent, so the card can say it. */
export interface AnomalyFind {
  h3: H3Index;
  text: string | null;
  gains: Partial<ResourcePool>;
  xp: number;
}

export interface AnomalyBinding {
  /** The anomaly on the selected cell, or `null`. */
  current: Anomaly | null;
  /** The last thing an anomaly paid out on this cell (Infinite 2026-09-29). */
  found: AnomalyFind | null;
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
  const [found, setFound] = useState<AnomalyFind | null>(null);

  const refetch = useCallback(async () => {
    if (repository) setAll(await repository.getAnomalies(now()));
  }, [repository, now]);

  useEffect(() => {
    void refetch();
  }, [refetch, trailVersion]);

  useEffect(() => {
    setRefusal(null);
    setFound(null);
  }, [selected]);

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

  const current = all.find((a) => a.h3 === selected) ?? null;
  return {
    current,
    found,
    refusal,
    onInvestigate: () => selected && repository && run(() => repository.investigateAnomaly(selected, now())),
    onResolve: () =>
      selected &&
      repository &&
      run(async () => {
        const r = await repository.resolveAnomaly(selected, now());
        if (r.ok && r.reward) setFound({ h3: selected, text: current?.sign.found ?? null, gains: r.reward.pool, xp: r.reward.xp });
        return r;
      }),
    onChoose: (i) =>
      selected &&
      repository &&
      run(async () => {
        const r = await repository.chooseInChain(selected, i, now());
        if (r.ok && (r.next === 'end' || r.xp > 0 || Object.keys(r.gained).length > 0)) {
          setFound({ h3: selected, text: r.next === 'end' ? 'The story closes. The ground is quiet again.' : null, gains: r.gained, xp: r.xp });
        }
        return r;
      }),
  };
}
