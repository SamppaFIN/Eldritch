/**
 * The Keep's Realm section (BRDC-KEEP-004).
 *
 * State-of-the-nation, gathered from the loose lines that used to trail the panel: what
 * fades and when, the dark time on the calendar, the one privacy sentence
 * BRDC-CASTLE-001 asks for, and jumping to the cell about to be lost. The Wager door
 * (`onWager`) is parked since BRDC-CLAIM-017 — see that prop's own comment.
 */
import { useState } from 'react';
import { landmarkOn, terrainForCell } from '@es3/core';
import type { Cell } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { GROUND_NAME } from '../territory/names.js';
import type { PublishResult } from '../../data/worldSource.js';
import './keep.css';

/** A landmark's real name outranks the bare ground it stands on — the same order `CellOn`
 *  already reads a hex in (BRDC-LANDMARK-001). */
function nameOf(cell: Cell): string {
  return landmarkOn(cell.h3)?.name ?? GROUND_NAME[terrainForCell(cell).kind];
}

const SENT: Record<PublishResult, string> = {
  ok: 'Sent. Others see your realm within the hour.',
  'rate-limited': 'Just sent one — try again in a minute.',
  failed: "Couldn't reach the world. Try again in a bit.",
};

/** Hours to a phrase. Duplicated from HearthPanel — five lines, not worth a shared import. */
function hours(h: number | null): string {
  if (h === null) return '—';
  if (h <= 1) return 'within the hour';
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} days`;
}

export interface KeepRealmProps {
  weakestH3: string | null;
  atRisk: number;
  firstLossInHours: number | null;
  /** The soonest few cells to fade, nearest first (`dominionOf`'s own `fading`). */
  fading: readonly { cell: Cell; hoursLeft: number }[];
  dark: { active: boolean; inDays: number };
  /** Absent since BRDC-CLAIM-017 — instant-capture ownership leaves the Wager's siege
   *  duel nothing left to settle. Not removed, only never wired to a door (§6 "parked
   *  the same shape as the claim chime"). */
  onWager?: (() => void) | undefined;
  /** Publish your realm to the shared world — present only when the share toggle is on. */
  onPublish?: (() => Promise<PublishResult>) | undefined;
  onWeakest: (h3: string) => void;
}

export function KeepRealm({
  weakestH3,
  atRisk,
  firstLossInHours,
  fading,
  dark,
  onWager,
  onPublish,
  onWeakest,
}: KeepRealmProps) {
  const [sent, setSent] = useState<PublishResult | 'sending' | null>(null);

  const raise = async () => {
    if (!onPublish || sent === 'sending') return;
    setSent('sending');
    setSent(await onPublish());
  };

  return (
    <section className="keep-section" aria-label="Realm">
      <h3 className="keep-section__head">Realm</h3>

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

      {weakestH3 && firstLossInHours !== null ? (
        <p className={`hearth-panel__line${atRisk > 0 ? ' hearth-panel__line--warn' : ''}`}>
          {atRisk > 0
            ? `${atRisk} ${atRisk === 1 ? 'cell fades' : 'cells fade'} within the day.`
            : 'Nothing fades today.'}{' '}
          The first goes {hours(firstLossInHours)} from now.
        </p>
      ) : null}

      {/* The soonest few, named and tappable — one aggregate sentence could say "3 cells
          fade" but not which ones, and the map does not follow you here (Sigil §06
          "NEXT 72 HOURS"). */}
      {fading.length > 0 ? (
        <ul className="keep-fading-list">
          {fading.map(({ cell, hoursLeft }) => (
            <li key={cell.h3}>
              <button type="button" className="keep-fading-row" onClick={() => onWeakest(cell.h3)}>
                <span className="keep-fading-name">{nameOf(cell)}</span>
                <span className="keep-fading-left es-numeric">{hours(hoursLeft)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/*
       * BRDC-KEEP-008: this used to promise a privacy split the game does not keep —
       * "only ever see your Keep, never your Hearth" — reversed by BRDC-CASTLE-001, whose
       * own `assignCastle` stores the Hearth's own cell as the Keep. Say what is actually
       * true instead of what the old plan wished were true.
       */}
      <p className="hearth-panel__line">
        Your Keep is your Hearth cell — whoever sees your realm sees exactly where it stands.
      </p>
      {onPublish ? (
        <p className="hearth-panel__line">
          {sent && sent !== 'sending'
            ? SENT[sent]
            : 'Raise your banner and your realm goes out to the world map. Others see it within the hour.'}
        </p>
      ) : (
        <p className="hearth-panel__line">
          Sharing the world is off, in Settings — turn it on to raise your banner.
        </p>
      )}

      <div className="hearth-panel__actions">
        {weakestH3 ? (
          <RitualButton variant="ghost" onClick={() => onWeakest(weakestH3)}>
            Show the first to fade
          </RitualButton>
        ) : null}
        {onWager ? (
          <RitualButton variant="ghost" onClick={onWager}>
            The Wager
          </RitualButton>
        ) : null}
        {onPublish ? (
          <RitualButton variant="ghost" onClick={raise} disabled={sent === 'sending'}>
            {sent === 'sending' ? 'Raising…' : 'Raise your banner'}
          </RitualButton>
        ) : null}
      </div>
    </section>
  );
}
