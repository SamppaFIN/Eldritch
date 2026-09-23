/**
 * Chronicles — every kingdom anyone has retired, shared (BRDC-HALL-003).
 *
 * Same shape as `useCodex`/`useRouteCodex`: fetched when the tab is opened, not on a
 * timer. `unreachable` and `empty` stay apart for the same reason they do there — a
 * player who just retired and sees "nobody has retired yet" would be told something
 * false about their own kingdom.
 */
import { useEffect, useState } from 'react';
import { fetchLegacy } from '../../data/legacy.js';
import type { LegacyEntry } from '../../data/legacy.js';

export type LegacyState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; entries: readonly LegacyEntry[] }
  | { status: 'empty' }
  | { status: 'unreachable' };

export function useLegacy(open: boolean): { state: LegacyState; reload: () => void } {
  const [state, setState] = useState<LegacyState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: 'loading' });
    void fetchLegacy().then((entries) => {
      if (cancelled) return;
      if (entries === null) {
        setState({ status: 'unreachable' });
        return;
      }
      setState(entries.length === 0 ? { status: 'empty' } : { status: 'ready', entries });
    });
    return () => {
      cancelled = true;
    };
  }, [open, nonce]);

  const reload = () => setNonce((n) => n + 1);
  return { state, reload };
}
