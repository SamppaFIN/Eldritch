/**
 * The pouch and its forecast, re-read whenever the ground changes and once a minute
 * besides.
 *
 * Reading `getResources` settles the trickle, so this is also what pays the player for
 * holding land — but the payment is computed from the clock, not from the polling, and
 * asking more often does not earn more. Lifted out of MapView, which was at its line
 * ceiling; `setResources` comes back so a ward can push a fresh pool straight in.
 *
 * It also reports the *gain* since the last read (BRDC-CHAR-001): the first read of the
 * session is the accrual from being away — a "while you were away" card — and any later
 * positive step is an hour rolling over, worth a small jingle.
 */
import { useEffect, useRef, useState } from 'react';
import { RESOURCE_KINDS, load, saveNow } from '@es3/core';
import type { Forecast, GameRepository, ResourceKind, ResourcePool } from '@es3/core';

/** The pouch as it stood at the last read, persisted so a new session can measure the wait. */
const LAST_KEY = 'last-pouch';

export interface PouchGain {
  delta: Partial<ResourcePool>;
  total: number;
  firstRead: boolean;
  at: number;
}

/** The per-resource increase from `prev` to `next`; `null` when nothing grew. */
export function positiveDelta(
  prev: ResourcePool | null,
  next: ResourcePool,
): { delta: Partial<ResourcePool>; total: number } | null {
  if (!prev) return null;
  const delta: Partial<ResourcePool> = {};
  let total = 0;
  for (const k of RESOURCE_KINDS as readonly ResourceKind[]) {
    const d = next[k] - prev[k];
    if (d > 0) {
      delta[k] = d;
      total += d;
    }
  }
  return total > 0 ? { delta, total } : null;
}

export function usePouchPolling(
  repository: GameRepository | null,
  now: () => number,
  /** Values that, when they change, force an immediate re-read. */
  triggers: readonly unknown[],
): {
  resources: ResourcePool | null;
  forecast: Forecast | null;
  gain: PouchGain | null;
  setResources: (pool: ResourcePool | null) => void;
} {
  const [resources, setResources] = useState<ResourcePool | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [gain, setGain] = useState<PouchGain | null>(null);
  // Seeded from the last session's saved pouch, so the first read of this one measures
  // the whole time you were away.
  const prev = useRef<ResourcePool | null>(load<ResourcePool | null>(LAST_KEY, null));
  const first = useRef(true);

  useEffect(() => {
    if (!repository) return;
    let alive = true;
    const read = () => {
      const t = now();
      void repository.getResources(t).then((pool) => {
        if (!alive) return;
        setResources(pool);
        const step = positiveDelta(prev.current, pool);
        if (step) setGain({ ...step, firstRead: first.current, at: t });
        prev.current = pool;
        first.current = false;
        saveNow(LAST_KEY, pool);
      });
      void repository.getForecast(t).then((f) => alive && setForecast(f));
    };
    read();
    const timer = setInterval(read, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [repository, now, ...triggers]);

  return { resources, forecast, gain, setResources };
}
