/**
 * Route mode's own leaderboard, fetched when it is opened (BRDC-MODE-002).
 *
 * Same shape as `useCodex` — a screen you visit, not a poll — but reading `RouteCodex`
 * rather than `Demographics`: a flat ranking by distance and hexes, not a seven-measure
 * table. Kept as its own hook rather than a generic over `useCodex` because the two
 * response shapes share nothing beyond "an array and a player count".
 */
import { useCallback, useEffect, useState } from 'react';
import type { RouteCodex } from '@es3/core';
import { fetchTable } from '../../data/worldSource.js';

export type RouteCodexState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; table: RouteCodex }
  | { status: 'empty' }
  | { status: 'unreachable' };

export function useRouteCodex(open: boolean): { state: RouteCodexState; reload: () => void } {
  const [state, setState] = useState<RouteCodexState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      const result = await fetchTable('/route-codex');
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: result.reason });
        return;
      }
      try {
        const table = JSON.parse(result.text) as RouteCodex;
        setState(
          Array.isArray(table.ranked) && table.players > 0
            ? { status: 'ready', table }
            : { status: 'empty' },
        );
      } catch {
        setState({ status: 'unreachable' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { state, reload };
}
