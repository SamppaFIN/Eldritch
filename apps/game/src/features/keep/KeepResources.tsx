/**
 * The Keep's Resources section (BRDC-ECON-004).
 *
 * What the pouch holds, per resource, and what it fills at — the detail the HUD's one
 * line cannot carry. "Collect" is deliberately cosmetic: production already trickles in
 * continuously (BRDC-ECON-001), so the button forces a settle and stamps "last looked",
 * turning a passive number into something you can tap. It is not a new bucket.
 */
import { useState } from 'react';
import { RESOURCE_KINDS, load, saveNow } from '@es3/core';
import type { GameRepository, ResourceKind, ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import { relativeTime } from '../log/describe.js';
import './keep.css';

const COLLECT_COOLDOWN_MS = 60_000;

/** The resources worth a row: any you hold, plus any coming in. Order is RESOURCE_KINDS. */
export function shownResources(
  pool: ResourcePool | null,
  perHour: Partial<ResourcePool>,
): ResourceKind[] {
  return RESOURCE_KINDS.filter((k) => (pool?.[k] ?? 0) > 0 || (perHour[k] ?? 0) > 0);
}

/** "3 h ago" / "not yet". */
export function sinceLabel(lastMs: number, now: number): string {
  return lastMs > 0 ? relativeTime(lastMs, now) : 'not yet';
}

export interface KeepResourcesProps {
  resources: ResourcePool | null;
  /** Per-resource hourly rate, forecast where known and terrain trickle otherwise. */
  perHour: Partial<ResourcePool>;
  producing: number;
  rate: number;
  resting: number;
  full: boolean;
  repository: GameRepository | null;
  now: number;
  onPouch: (pool: ResourcePool) => void;
}

export function KeepResources({
  resources,
  perHour,
  producing,
  rate,
  resting,
  full,
  repository,
  now,
  onPouch,
}: KeepResourcesProps) {
  const [lastCollect, setLastCollect] = useState(() => load<number>('last-collect', 0));
  // What you hold and what is coming in, together — a resource sitting at zero growth is
  // still a fact worth a row (Sigil §06's own "100 · +0" treasury line), not just the ones
  // presently ticking up.
  const held = shownResources(resources, perHour);
  const canCollect = now - lastCollect >= COLLECT_COOLDOWN_MS;

  const collect = () => {
    if (!repository || !canCollect) return;
    void repository.getResources(now).then(onPouch);
    saveNow('last-collect', now);
    setLastCollect(now);
  };

  return (
    <section className="keep-section" aria-label="Resources">
      <h3 className="keep-section__head">Resources</h3>

      {/*
        * What each resource *earns*, not what you hold.
        *
        * The amounts moved out (Infinite, 2026-09-15: "voit myös poistaa nuo
        * resurssimäärät keep välilehdeltä.. nyt ne näkyy paneelissa"). The walking sheet
        * carries the pouch as chips now, and a number shown twice on two screens is the
        * thing this whole pass has been removing. The hourly rate is not in the sheet and
        * is the question the Keep is actually for: which ground is paying you.
        */}
      {held.length > 0 ? (
        <ul className="keep-res-list">
          {held.map((k) => (
            <li key={k} className="keep-res-row">
              <span
                className="keep-res-pip"
                style={{ background: RESOURCE_COLOUR[k] }}
                aria-hidden
              />
              <span className="keep-res-name">{RESOURCE_WORD[k]}</span>
              <span className="keep-res-amount es-numeric">{resources?.[k] ?? 0}</span>
              <span className="keep-res-rate es-numeric">+{perHour[k] ?? 0}/h</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="hearth-panel__line">
        {rate > 0
          ? `${producing} of your cells produce — ${rate} an hour in all.`
          : 'None of your ground produces yet. Woodland, water and places of trade do.'}
        {resting > 0
          ? ` ${resting} more ${resting === 1 ? 'is' : 'are'} resting — walk them to wake them.`
          : ''}
      </p>

      {full ? (
        <p className="hearth-panel__line hearth-panel__line--warn">
          Storage is full — production has stalled. Spend some to make room.
        </p>
      ) : null}

      <div className="keep-collect-row">
        <RitualButton
          variant="ghost"
          className="keep-collect"
          disabled={!canCollect}
          onClick={collect}
        >
          Collect
        </RitualButton>
        <span className="keep-collect-when">Last collected · {sinceLabel(lastCollect, now)}</span>
      </div>
    </section>
  );
}
