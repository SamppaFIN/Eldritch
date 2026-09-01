/**
 * Trade Routes: the held list, and the two-tap flow to lay one (BRDC-BUILD-004).
 *
 * Lifted out of `useSelection` when that file reached its line limit. A route binds two
 * cells, so laying one is not a button — it arms, then the next tap on another held cell
 * is the far end. `interceptTap` is how `useSelection.onCellTap` hands that tap over.
 */
import { useCallback, useEffect, useState } from 'react';
import type { GameRepository, H3Index, RouteRefusal, TradeRoute } from '@es3/core';
import type { TradeBinding } from './useSelection.js';

type RouteFail = RouteRefusal | 'no-such-route';

export interface UseTradeRoutes {
  binding: TradeBinding;
  /** Consume a tap as the far end of a pending link; returns true if it did. */
  interceptTap: (h3: H3Index) => boolean;
}

export function useTradeRoutes(
  repository: GameRepository | null,
  now: () => number,
  trailVersion: number,
  afterSpend: () => Promise<void>,
): UseTradeRoutes {
  const [routes, setRoutes] = useState<readonly TradeRoute[]>([]);
  const [linkFrom, setLinkFrom] = useState<H3Index | null>(null);
  const [refusal, setRefusal] = useState<RouteFail | null>(null);

  useEffect(() => {
    if (!repository) return;
    let alive = true;
    void repository.getTradeRoutes().then((r) => {
      if (alive) setRoutes(r);
    });
    return () => {
      alive = false;
    };
  }, [repository, trailVersion]);

  const settle = useCallback(
    async (ok: boolean) => {
      if (!repository || !ok) return;
      setRoutes(await repository.getTradeRoutes());
      await afterSpend();
    },
    [repository, afterSpend],
  );

  const interceptTap = useCallback(
    (h3: H3Index): boolean => {
      if (!linkFrom || !repository || h3 === linkFrom) return false;
      const from = linkFrom;
      setLinkFrom(null);
      void (async () => {
        const r = await repository.layTradeRoute(from, h3, now());
        setRefusal(r.ok ? null : r.refused);
        await settle(r.ok);
      })();
      return true;
    },
    [linkFrom, repository, now, settle],
  );

  const onRemove = useCallback(
    (a: H3Index, b: H3Index) => {
      if (!repository) return;
      void (async () => {
        const r = await repository.removeTradeRoute(a, b, now());
        setRefusal(r.ok ? null : r.refused);
        await settle(r.ok);
      })();
    },
    [repository, now, settle],
  );

  return {
    binding: {
      routes,
      linkFrom,
      refusal,
      onStartLink: setLinkFrom,
      onCancelLink: useCallback(() => setLinkFrom(null), []),
      onRemove,
    },
    interceptTap,
  };
}
