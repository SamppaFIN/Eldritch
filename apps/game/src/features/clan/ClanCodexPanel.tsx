/**
 * The clan league — every clan measured against every other (BRDC-CLAN-002).
 *
 * The same table `CodexPanel` shows for players, fed `/clan-codex` instead of
 * `/demographics` through the same `useCodex` (parameterized by path, not copied) and
 * the same `figures.ts` formatting — a clan's row reads exactly like a realm's, because
 * `Measurable`/`Metric` never knew the difference between one player and a clan's worth
 * of them.
 */
import { useEffect, useRef, useState } from 'react';
import { EmptyState, GlassPanel, MetatronsCube, RitualButton } from '@es3/ui';
import { placementIn } from '@es3/core';
import type { Metric } from '@es3/core';
import { useCodex } from '../codex/useCodex.js';
import {
  METRIC_BLURB,
  METRIC_NAME,
  METRIC_TITLE,
  barPct,
  formatMetric,
  gapLine,
  ordinal,
  overallStanding,
  placeWord,
} from '../codex/figures.js';
import '../codex/codex-panel.css';

export interface ClanCodexPanelProps {
  open: boolean;
  /** This device's own clan, so every row can say where it stands. */
  myClanId: string | null;
  onClose: () => void;
}

const TOP = 3;

export function ClanCodexPanel({ open, myClanId, onClose }: ClanCodexPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { state, reload } = useCodex(open, '/clan-codex');
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

  const listed =
    myClanId !== null &&
    state.status === 'ready' &&
    state.table.metrics.some((m) => placementIn(m, myClanId) !== null);

  const overall =
    myClanId !== null && state.status === 'ready' ? overallStanding(state.table.metrics, myClanId) : null;

  const row = (metric: Metric) => {
    const mine = myClanId ? placementIn(metric, myClanId) : null;
    const gap = mine ? gapLine(metric, mine.value, mine.rank) : null;
    const showing = expanded === metric.id;
    const titled = mine?.rank === 1;
    return (
      <li key={metric.id} className={`codex__row${titled ? ' codex__row--titled' : ''}`}>
        <button
          type="button"
          className="codex__head"
          aria-expanded={showing}
          onClick={() => setExpanded(showing ? null : metric.id)}
        >
          <span className="codex__name">
            {METRIC_NAME[metric.id]}
            {titled ? <span className="codex__title">{METRIC_TITLE[metric.id]}</span> : null}
          </span>
          {mine ? (
            <>
              <span className="codex__mine es-numeric">{formatMetric(metric.id, mine.value)}</span>
              <span className="codex__place">
                {placeWord(mine.rank, mine.of)}
                {gap ? ` · ${gap}` : ''}
              </span>
            </>
          ) : null}
        </button>

        {mine ? (
          <div className="codex__bar-track" aria-hidden>
            <div
              className="codex__bar-avg"
              style={{ insetInlineStart: `${barPct(metric.average, metric.worst, metric.best)}%` }}
            />
            <div
              className="codex__bar-fill"
              style={{ inlineSize: `${barPct(mine.value, metric.worst, metric.best)}%` }}
            />
          </div>
        ) : null}

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
                <li
                  key={r.id}
                  className={r.id === myClanId ? 'codex__top-row codex__top-row--me' : 'codex__top-row'}
                >
                  <span className="codex__realm">{r.name}</span>
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
    <GlassPanel as="section" ref={panelRef} className="codex" aria-label="Clan Codex" tabIndex={-1}>
      <div className="codex__bar">
        <h2 className="codex__title">Clan Codex</h2>
        <RitualButton variant="ghost" className="codex__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {state.status === 'loading' ? <p className="codex__note">Reading the world…</p> : null}

      {state.status === 'empty' ? (
        <p className="codex__note">
          No clan has published yet. Join or start one from the menu, and the league fills as
          others do the same.
        </p>
      ) : null}

      {state.status === 'unreachable' ? (
        <>
          <p className="codex__note">
            The league could not be reached. Your own clan is safe — this is the shared world
            being quiet, not your realm.
          </p>
          <RitualButton variant="ghost" className="codex__reload" onClick={reload}>
            Try again
          </RitualButton>
        </>
      ) : null}

      {state.status === 'ready' ? (
        <>
          <p className="codex__note">
            {state.table.players} {state.table.players === 1 ? 'clan' : 'clans'} measured
            {overall ? (
              <>
                {' '}
                · your clan is <strong className="codex__overall">{ordinal(overall.rank)}</strong> overall
              </>
            ) : null}
            . Tap a row for what it means and who leads it.
          </p>
          {myClanId === null ? (
            <EmptyState
              mark={<MetatronsCube size={56} />}
              ink="var(--r-culture)"
              title="No clan of your own"
              body="Join or start a clan from the menu, and it joins this league within the hour."
            />
          ) : listed ? null : (
            <EmptyState
              mark={<MetatronsCube size={56} />}
              ink="var(--r-culture)"
              title="Not in the reckoning yet"
              body="Your clan is not among the measured ones yet. Raise your banner from the menu and it joins within the hour."
            />
          )}
          <ul className="codex__list">{state.table.metrics.map(row)}</ul>
          <RitualButton variant="ghost" className="codex__reload" onClick={reload}>
            Read again
          </RitualButton>
        </>
      ) : null}
    </GlassPanel>
  );
}
