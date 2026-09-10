/**
 * The Codex of Dominion — where you stand, one measure at a time (BRDC-CODEX-001).
 *
 * Civilization's Demographics screen, not a scoreboard. Each row is a measure: your
 * figure, your placing, and the best, average and worst across every realm that has
 * published. A leaderboard tells six of seven friends that they lost; this tells all seven
 * something true about their own realm, and lets a player who is third in Land find that
 * they are first in Ley-line.
 *
 * The panel is the same shape as `LogPanel` and `HelpPanel`: non-modal `GlassPanel`, ESC
 * closes, capped above the HUD and scrolling inside.
 */
import { useEffect, useRef, useState } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { placementIn } from '@es3/core';
import type { Metric, PlayerId } from '@es3/core';
import { useCodex } from './useCodex.js';
import { METRIC_BLURB, METRIC_NAME, formatMetric, placeWord } from './figures.js';
import './codex-panel.css';

export interface CodexPanelProps {
  open: boolean;
  /** The local player, so every row can say where *they* stand. */
  me: PlayerId | null;
  onClose: () => void;
}

/** The realms at the top of one measure — three is enough to see the shape of the field. */
const TOP = 3;

export function CodexPanel({ open, me, onClose }: CodexPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { state, reload } = useCodex(open);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const row = (metric: Metric) => {
    const mine = me ? placementIn(metric, me) : null;
    const showing = expanded === metric.id;
    return (
      <li key={metric.id} className="codex__row">
        <button
          type="button"
          className="codex__head"
          aria-expanded={showing}
          onClick={() => setExpanded(showing ? null : metric.id)}
        >
          <span className="codex__name">{METRIC_NAME[metric.id]}</span>
          <span className="codex__mine es-numeric">
            {mine ? formatMetric(metric.id, mine.value) : '—'}
          </span>
          <span className="codex__place">{mine ? placeWord(mine.rank, mine.of) : 'not listed'}</span>
        </button>

        <dl className="codex__figures es-numeric">
          <div>
            <dt>Best</dt>
            <dd>{formatMetric(metric.id, metric.best)}</dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd>{formatMetric(metric.id, metric.average)}</dd>
          </div>
          <div>
            <dt>Worst</dt>
            <dd>{formatMetric(metric.id, metric.worst)}</dd>
          </div>
        </dl>

        {showing ? (
          <div className="codex__detail">
            <p className="codex__blurb">{METRIC_BLURB[metric.id]}</p>
            <ol className="codex__top es-numeric">
              {metric.ranked.slice(0, TOP).map((r) => (
                <li key={r.id} className={r.id === me ? 'codex__top-row codex__top-row--me' : 'codex__top-row'}>
                  <span className="codex__flag" aria-hidden>{r.banner ?? '·'}</span>
                  <span className="codex__realm">{r.nation ?? r.name}</span>
                  <span>{formatMetric(metric.id, r.value)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <GlassPanel as="section" ref={panelRef} className="codex" aria-label="Codex of Dominion" tabIndex={-1}>
      <div className="codex__bar">
        <h2 className="codex__title">Codex of Dominion</h2>
        <RitualButton variant="ghost" className="codex__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {state.status === 'loading' ? <p className="codex__note">Reading the world…</p> : null}

      {state.status === 'empty' ? (
        <p className="codex__note">
          No realm has published yet. Raise your banner from the menu, and the Codex fills as
          others do the same.
        </p>
      ) : null}

      {state.status === 'unreachable' ? (
        <>
          <p className="codex__note">
            The Codex could not be reached. Your own realm is safe on this device — this is
            the shared world being quiet, not your ground.
          </p>
          <RitualButton variant="ghost" className="codex__reload" onClick={reload}>
            Try again
          </RitualButton>
        </>
      ) : null}

      {state.status === 'ready' ? (
        <>
          <p className="codex__note">
            {state.table.players} {state.table.players === 1 ? 'realm' : 'realms'} measured. Tap a
            row for what it means and who leads it.
          </p>
          <ul className="codex__list">{state.table.metrics.map(row)}</ul>
          <RitualButton variant="ghost" className="codex__reload" onClick={reload}>
            Read again
          </RitualButton>
        </>
      ) : null}
    </GlassPanel>
  );
}
