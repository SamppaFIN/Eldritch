/**
 * The Season — distance and hexes gained since the trail started being tracked
 * (BRDC-SEASON-001). A week's competition for six known players, read the same way
 * `RouteCodexPanel` reads Route mode's lifetime table: a flat ranking, no per-measure
 * detail. The difference is what it counts — gained-since-then, not ever.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { formatDistance } from '../codex/figures.js';
import { useSeason } from './useSeason.js';
import './season-panel.css';

export interface SeasonPanelProps {
  open: boolean;
  me: string | null;
  onClose: () => void;
}

/** "day-20345" → a rough "N days" span against today, without pulling in a date library
 *  for one subtraction. */
function daysSince(dayKey: string): number {
  const day = Number(dayKey.slice('day-'.length));
  const today = Math.floor(Date.now() / 86_400_000);
  return Math.max(0, today - day);
}

export function SeasonPanel({ open, me, onClose }: SeasonPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { state, reload } = useSeason(open);

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
    <GlassPanel as="section" ref={panelRef} className="season" aria-label="The Season" tabIndex={-1}>
      <div className="season__bar">
        <h2 className="season__title">The Season</h2>
        <RitualButton variant="ghost" className="season__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {state.status === 'loading' ? <p className="season__note">Reading the trail…</p> : null}

      {state.status === 'empty' ? (
        <p className="season__note">
          No trail yet — the Worker keeps one snapshot a day, so this fills in once anyone
          has published on two different days.
        </p>
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
            Gained over the last {daysSince(state.sinceDayKey)}{' '}
            {daysSince(state.sinceDayKey) === 1 ? 'day' : 'days'}.
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
                  +{formatDistance(Math.max(0, r.distanceGained))} · +
                  {Math.max(0, r.hexesGained)} {r.hexesGained === 1 ? 'hex' : 'hexes'}
                </span>
              </li>
            ))}
          </ol>
          <RitualButton variant="ghost" onClick={reload}>
            Read again
          </RitualButton>
        </>
      ) : null}
    </GlassPanel>
  );
}
