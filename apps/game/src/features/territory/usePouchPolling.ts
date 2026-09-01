/**
 * The pouch and its forecast, re-read whenever the ground changes and once a minute
 * besides.
 *
 * Reading `getResources` settles the trickle, so this is also what pays the player for
 * holding land — but the payment is computed from the clock, not from the polling, and
 * asking more often does not earn more. Lifted out of MapView, which was at its line
 * ceiling; `setResources` comes back so a ward can push a fresh pool straight in.
 */
import { useEffect, useState } from 'react';
import type { Forecast, GameRepository, ResourcePool } from '@es3/core';

export function usePouchPolling(
  repository: GameRepository | null,
  now: () => number,
  /** Values that, when they change, force an immediate re-read. */
  triggers: readonly unknown[],
): {
  resources: ResourcePool | null;
  forecast: Forecast | null;
  setResources: (pool: ResourcePool | null) => void;
} {
  const [resources, setResources] = useState<ResourcePool | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    if (!repository) return;
    let alive = true;
    const read = () => {
      const t = now();
      void repository.getResources(t).then((pool) => alive && setResources(pool));
      void repository.getForecast(t).then((f) => alive && setForecast(f));
    };
    read();
    const timer = setInterval(read, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [repository, now, ...triggers]);

  return { resources, forecast, setResources };
}
