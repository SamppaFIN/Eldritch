/**
 * The Season — distance and hexes gained since each player chose to join
 * (BRDC-SEASON-001). Read the same way `RouteCodexPanel` reads Route mode's lifetime
 * table: a flat ranking, no per-measure detail. The difference is what it counts —
 * gained since *you* joined, not a fixed calendar date every player is measured against.
 */
import { useEffect, useRef } from 'react';
import type { GameRepository } from '@es3/core';
import { EmptyState, GlassPanel, HexMandala, RitualButton } from '@es3/ui';
import { relativeTime } from '../log/describe.js';
import { formatDistance } from '../codex/figures.js';
import { useSeason } from './useSeason.js';
import './season-panel.css';

export interface SeasonPanelProps {
  open: boolean;
  me: string | null;
  repository: GameRepository | null;
  now: () => number;
  /** Joining turns "Share your realm" on — see `useSeason`. */
  onJoined?: () => void;
  onClose: () => void;
}

export function SeasonPanel({ open, me, repository, now, onJoined, onClose }: SeasonPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { state, reload, joining, join } = useSeason(open, repository, onJoined);

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

  const joined = state.status === 'ready' && state.rows.some((r) => r.id === me);

  const joinButton = (
    <RitualButton variant="ghost" disabled={joining || !repository} onClick={join}>
      {joining ? 'Joining…' : 'Join the Weekly Tournament'}
    </RitualButton>
  );

  return (
    <GlassPanel as="section" ref={panelRef} className="season" aria-label="The Season" tabIndex={-1}>
      <div className="season__bar">
        <h2 className="season__title">The Season</h2>
        <RitualButton variant="ghost" className="season__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {state.status === 'loading' ? <p className="season__note">Reading the trail…</p> : null}

      {state.status === 'empty' ? (
        <>
          <EmptyState
            mark={<HexMandala size={56} />}
            ink="var(--r-token)"
            title="Nobody has joined yet"
            body="Join the Weekly Tournament and your distance and hexes from right now become your starting line. Joining also turns on Share your realm, so what you gain reaches the list."
          />
          {joinButton}
        </>
      ) : null}

      {state.status === 'unreachable' ? (
        <>
          <p className="season__note">
            The Season could not be reached. Your own walk is safe either way — this is the
            shared world being quiet, not your progress.
          </p>
          <RitualButton variant="ghost" onClick={reload}>
            Try again
          </RitualButton>
        </>
      ) : null}

      {state.status === 'ready' ? (
        <>
          <p className="season__note">
            {joined
              ? 'Gained since you joined. Follows each player’s latest publish.'
              : 'Join to put your own starting line on this list.'}
          </p>
          <ol className="season__list es-numeric">
            {state.rows.map((r, i) => (
              <li
                key={r.id}
                className={r.id === me ? 'season__row season__row--me' : 'season__row'}
              >
                <span className="season__rank" aria-hidden>
                  {i + 1}
                </span>
                <span className="season__name">{r.name}</span>
                <span className="season__figure">
                  +{formatDistance(r.distanceGained)} · +{r.hexesGained}{' '}
                  {r.hexesGained === 1 ? 'hex' : 'hexes'}
                </span>
                <span className="season__joined">joined {relativeTime(r.joinedAt, now())}</span>
              </li>
            ))}
          </ol>
          {joined ? null : joinButton}
          <RitualButton variant="ghost" onClick={reload}>
            Read again
          </RitualButton>
        </>
      ) : null}
    </GlassPanel>
  );
}
