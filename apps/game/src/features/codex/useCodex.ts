/**
 * The Codex of Dominion, fetched when it is opened (BRDC-CODEX-001).
 *
 * Not on a timer and not at boot: it is a screen you visit, and the table only changes
 * when somebody publishes.
 *
 * `empty` and `unreachable` stay apart all the way to the screen. A player who has just
 * published and is told "no realm has published yet" learns something false about their
 * own game — which is exactly what happened the first time this shipped.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Demographics } from '@es3/core';
import { fetchDemographics } from '../../data/worldSource.js';

export type CodexState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; table: Demographics }
  | { status: 'empty' }
  | { status: 'unreachable' };

export function useCodex(open: boolean): { state: CodexState; reload: () => void } {
  const [state, setState] = useState<CodexState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      const result = await fetchDemographics();
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: result.reason });
        return;
      }
      // A table that arrived but will not parse is a broken answer, not an absent one:
      // the Worker is reachable and saying something this client cannot read.
      try {
        const table = JSON.parse(result.text) as Demographics;
        setState(
          Array.isArray(table.metrics) && table.players > 0
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
