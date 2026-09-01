/**
 * The Hearth, opened.
 *
 * Every other cell on the map is about itself. This one is about the whole of it — it is
 * where the player agreed to start, and it is the natural place to ask "what have I
 * built" rather than "what is under my feet".
 *
 * It also gives the Wager a door from the map. Until now a challenge could only be sent
 * from the title screen, which meant ending a walk to reach it (BRDC-WAGER-JSON-001,
 * known limitation). Standing on your own Hearth is a better place to be asked.
 */
import { useState } from 'react';
import { GlassPanel, MetatronsCube, RitualButton } from '@es3/ui';
import { BASE_STORAGE_CAP, RESOURCE_KINDS, darkTimeAt } from '@es3/core';
import type { Cell, Forecast, ResourceKind, ResourcePool } from '@es3/core';
import { dominionOf } from './dominion.js';
import { ResearchPanel } from './ResearchPanel.js';
import type { ResearchBinding } from './useSelection.js';
import { AdventureDialog } from '../quest/AdventureDialog.js';
import type { AdventureBinding } from '../quest/useAdventure.js';
import './hearth-panel.css';

export interface HearthPanelProps {
  /** Every cell the player holds, already projected to `now`. */
  owned: readonly Cell[];
  resources: ResourcePool | null;
  places: number;
  level: number;
  levelName: string;
  now: number;
  /** The research screen's bundle (BRDC-TECH-001), from `useSelection`. */
  research: ResearchBinding;
  /** The adventure book, opened from here (BRDC-QUEST-001). Lifted to MapView so the map
   *  can reveal landmarks by stage. */
  adventures: AdventureBinding;
  /** Per-hour / per-day production, as the pouch will actually earn it (BRDC-STATS-001). */
  forecast: Forecast | null;
  onWager: () => void;
  /** Opens the weakest cell, so the fix for a warning is one tap from the warning. */
  onWeakest: (h3: string) => void;
  onClose: () => void;
}

function area(m2: number): string {
  return m2 < 10_000 ? `${Math.round(m2)} m²` : `${(m2 / 10_000).toFixed(1)} ha`;
}

function hours(h: number | null): string {
  if (h === null) return '—';
  if (h <= 1) return 'within the hour';
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} days`;
}

export function HearthPanel({
  owned,
  resources,
  places,
  level,
  levelName,
  now,
  research,
  adventures,
  forecast,
  onWager,
  onWeakest,
  onClose,
}: HearthPanelProps) {
  const [questOpen, setQuestOpen] = useState(false);
  const questLabel = adventures.active
    ? `${adventures.active.title} · continue`
    : `${adventures.list.filter((a) => a.state === 'available').length} to begin`;
  const d = dominionOf(owned, now);
  const dark = darkTimeAt(now);
  const perHour = forecast?.perHour ?? {};
  const forecastLine = (Object.keys(perHour) as ResourceKind[])
    .filter((k) => (perHour[k] ?? 0) > 0)
    .map((k) => `${perHour[k]} ${k}/h`)
    .join(' · ');
  const rate = RESOURCE_KINDS.reduce((sum, k) => sum + d.perHour[k], 0);
  const producingCount = RESOURCE_KINDS.reduce((sum, k) => sum + d.producing[k], 0);
  // BRDC-ECON-001: a full resource stops earning rather than overflowing silently, and
  // the player is told in words, not left to notice the pouch has quietly stopped moving.
  const full = resources ? RESOURCE_KINDS.some((k) => d.perHour[k] > 0 && resources[k] >= BASE_STORAGE_CAP) : false;

  return (
    <>
    <GlassPanel as="section" className="hearth-panel" aria-label="Your sanctuary">
      <div className="hearth-panel__head">
        <MetatronsCube size={44} animate={1200} className="hearth-panel__sigil" />
        <div>
          <p className="hearth-panel__title">Your Anchor Stone</p>
          <p className="hearth-panel__sub">
            Consciousness {level} · {levelName}
          </p>
        </div>
        <RitualButton
          variant="ghost"
          className="hearth-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      <dl className="hearth-panel__stats">
        <div>
          <dt>Warded</dt>
          <dd className="es-numeric">{d.cells}</dd>
        </div>
        <div>
          <dt>Land</dt>
          <dd className="es-numeric">{area(d.areaM2)}</dd>
        </div>
        <div>
          <dt>Strongest</dt>
          <dd className="es-numeric">{Math.round(d.strongest)}</dd>
        </div>
        <div>
          <dt>Temples</dt>
          <dd className="es-numeric">{places}</dd>
        </div>
      </dl>

      <p className="hearth-panel__line">
        {/* Production is the number that explains why one walk was worth more than
            another, and it exists nowhere else in the interface. */}
        {rate > 0
          ? `${producingCount} of your cells produce — ${rate} an hour in all.`
          : 'None of your ground produces yet. Woodland, water and places of trade do.'}
        {d.resting > 0
          ? ` ${d.resting} more ${d.resting === 1 ? 'is' : 'are'} resting — walk them to wake them.`
          : ''}
      </p>

      {/* The forecast: what the pouch will actually fill at, buildings and auras and the
          storage ceiling all folded in (BRDC-STATS-001). */}
      {forecastLine ? (
        <p className="hearth-panel__line es-numeric">Forecast · {forecastLine}</p>
      ) : null}

      {full ? (
        <p className="hearth-panel__line hearth-panel__line--warn">
          Storage is full — production has stalled. Spend some to make room.
        </p>
      ) : null}

      {/* The world's winter — predictable from the calendar, so it is said before it
          bites, not after (BRDC-EVENT-001). */}
      {dark.active ? (
        <p className="hearth-panel__line hearth-panel__line--warn">
          The dark time holds. Everything you make comes slower — {dark.inDays}{' '}
          {dark.inDays === 1 ? 'day' : 'days'} until it lifts.
        </p>
      ) : dark.inDays <= 21 ? (
        <p className="hearth-panel__line">
          The dark time comes in {dark.inDays} days. Production will slow while it lasts.
        </p>
      ) : null}

      {resources ? (
        <p className="hearth-panel__line es-numeric">
          Pouch · {resources.food} food · {resources.wood} timber · {resources.gold} gold
        </p>
      ) : null}

      <ResearchPanel
        research={research}
        pool={resources}
        wisdomPerHour={forecast?.perHour.wisdom ?? 0}
      />

      <p className="hearth-panel__line">
        {/* The one sentence BRDC-CASTLE-001 asks for: no settings page, just said once,
            where a player already comes to ask "what have I built". */}
        Other players will only ever see your Keep, never your Hearth.
      </p>

      {d.weakest && d.firstLossInHours !== null ? (
        <p className={`hearth-panel__line${d.atRisk > 0 ? ' hearth-panel__line--warn' : ''}`}>
          {d.atRisk > 0
            ? `${d.atRisk} ${d.atRisk === 1 ? 'cell fades' : 'cells fade'} within the day.`
            : 'Nothing fades today.'}{' '}
          The first goes {hours(d.firstLossInHours)} from now.
        </p>
      ) : null}

      <div className="hearth-panel__actions">
        {d.weakest ? (
          <RitualButton variant="ghost" onClick={() => onWeakest((d.weakest as Cell).h3)}>
            Show the first to fade
          </RitualButton>
        ) : null}
        <RitualButton variant="ghost" onClick={onWager}>
          The Wager
        </RitualButton>
        <RitualButton variant="ghost" onClick={() => setQuestOpen(true)}>
          Adventures · {questLabel}
        </RitualButton>
      </div>
    </GlassPanel>
    {questOpen ? (
      <AdventureDialog binding={adventures} onClose={() => setQuestOpen(false)} />
    ) : null}
    </>
  );
}
