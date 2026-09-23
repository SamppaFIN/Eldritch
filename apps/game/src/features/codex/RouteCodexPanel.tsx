/**
 * Route Ledger — Route mode's own leaderboard: distance walked and hexes taken, nothing
 * else (BRDC-MODE-002). Deliberately not the Codex of Dominion: that table measures
 * consciousness, works and provinces, none of which Route mode ever earns, so it is a
 * flat ranking rather than the seven-measure `CodexPanel` shape.
 *
 * Same sheet as `CodexPanel`/`ClanCodexPanel` (`codex-panel.css`), just a plainer list —
 * `.codex__top-row`'s three columns hold a rank, a name and "distance · hexes" instead of
 * a metric's own figure.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { formatDistance } from './figures.js';
import { useRouteCodex } from './useRouteCodex.js';
import './codex-panel.css';

export interface RouteCodexPanelProps {
  open: boolean;
  /** The local player, so their own line can be picked out. */
  me: string | null;
  onClose: () => void;
}

export function RouteCodexPanel({ open, me, onClose }: RouteCodexPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { state, reload } = useRouteCodex(open);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <GlassPanel as="section" ref={panelRef} className="codex" aria-label="Route Ledger" tabIndex={-1}>
      <div className="codex__bar">
        <h2 className="codex__title">Route Ledger</h2>
        <RitualButton variant="ghost" className="codex__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {state.status === 'loading' ? <p className="codex__note">Reading the world…</p> : null}

      {state.status === 'empty' ? (
        <p className="codex__note">
          No route has published yet. Walk on, and the ledger fills as others do the same.
        </p>
      ) : null}

      {state.status === 'unreachable' ? (
        <>
          <p className="codex__note">
            The ledger could not be reached. Your own distance is safe on this device — this
            is the shared world being quiet, not your walk.
          </p>
          <RitualButton variant="ghost" className="codex__reload" onClick={reload}>
            Try again
          </RitualButton>
        </>
      ) : null}

      {state.status === 'ready' ? (
        <>
          <p className="codex__note">
            {state.table.players} {state.table.players === 1 ? 'walker' : 'walkers'} measured.
          </p>
          <ol className="codex__top es-numeric">
            {state.table.ranked.map((r, i) => (
              <li
                key={r.id}
                className={r.id === me ? 'codex__top-row codex__top-row--me' : 'codex__top-row'}
              >
                <span className="codex__flag" aria-hidden>
                  {i + 1}
                </span>
                <span className="codex__realm">{r.name}</span>
                <span>
                  {formatDistance(r.distanceM)} · {r.hexes} {r.hexes === 1 ? 'hex' : 'hexes'}
                </span>
              </li>
            ))}
          </ol>
          <RitualButton variant="ghost" className="codex__reload" onClick={reload}>
            Read again
          </RitualButton>
        </>
      ) : null}
    </GlassPanel>
  );
}
