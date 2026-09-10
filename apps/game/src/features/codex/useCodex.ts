/**
 * The Codex of Dominion, fetched when it is opened (BRDC-CODEX-001).
 *
 * Not on a timer and not at boot: it is a screen you visit, and the table only changes
 * when somebody publishes. Every failure is a quiet `null` — the shared world is optional
 * and a player with no friends online should see "nobody has published", not an error.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Demographics } from '@es3/core';
import { fetchDemographics } from '../../data/worldSource.js';

export type CodexState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; table: Demographics }
  | { status: 'empty' };

export function useCodex(open: boolean): { state: CodexState; reload: () => void } {
  const [state, setState] = useState<CodexState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      const text = await fetchDemographics();
      if (cancelled) return;
      // A table that will not parse is the same to the player as no table at all, and
      // saying "damaged" about somebody else's server helps nobody.
      try {
        const table = text ? (JSON.parse(text) as Demographics) : null;
        setState(
          table && Array.isArray(table.metrics) && table.players > 0
            ? { status: 'ready', table }
            : { status: 'empty' },
        );
      } catch {
        setState({ status: 'empty' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { state, reload };
}
