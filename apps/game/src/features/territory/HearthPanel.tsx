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
import { GlassPanel, MetatronsCube, RitualButton } from '@es3/ui';
import type { Cell, ResourcePool } from '@es3/core';
import { dominionOf } from './dominion.js';
import './hearth-panel.css';

export interface HearthPanelProps {
  /** Every cell the player holds, already projected to `now`. */
  owned: readonly Cell[];
  resources: ResourcePool | null;
  places: number;
  level: number;
  levelName: string;
  now: number;
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
  onWager,
  onWeakest,
  onClose,
}: HearthPanelProps) {
  const d = dominionOf(owned, now);
  const rate = d.perHour.water + d.perHour.wood + d.perHour.gold;

  return (
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
          ? `${d.producing.water + d.producing.wood + d.producing.gold} of your cells produce — ${rate} an hour in all.`
          : 'None of your ground produces yet. Woodland, water and places of trade do.'}
      </p>

      {resources ? (
        <p className="hearth-panel__line es-numeric">
          Pouch · {resources.water} water · {resources.wood} timber · {resources.gold} gold
        </p>
      ) : null}

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
      </div>
    </GlassPanel>
  );
}
