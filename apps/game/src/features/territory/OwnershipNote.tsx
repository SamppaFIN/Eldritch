/**
 * Who holds this cell, as a ring — on every owned cell now, not only a shared one
 * (BRDC-WAGER-JSON-007).
 *
 * A hex you hold outright is a full purple ring, "Yours · 100%". A cell an imported
 * Wager also claims (BRDC-WAGER-JSON-006) stays yours — a text message cannot take
 * ground — but the hourly yield splits, and the ring splits with it: your slice in the
 * purple the map paints your ground, theirs in the fixed rival red. A rival's own cell
 * is a full red ring. No new legend, no new colour.
 *
 * Rendered inside `CellPanel`; styled from `wager.css`, always bundled.
 */
import { localShare } from '@es3/core';
import type { Cell } from '@es3/core';
import { OWN_STROKE, ENEMY_STROKE } from './territoryFeatures.js';

export interface OwnershipNoteProps {
  cell: Cell;
  /** The local player, so the ring is drawn from their side of the split. */
  me: string | null;
}

export function OwnershipNote({ cell, me }: OwnershipNoteProps) {
  if (cell.ownerId === null) return null;
  const mine = cell.ownerId === me;
  const s = cell.shared;

  // My percentage of the yield: all of it on a cell I hold alone, none on a rival's,
  // and `localShare` on one an import also claims.
  const minePct = Math.round((mine ? (s ? localShare(cell) : 1) : 0) * 100);

  const head = s
    ? `Shared with ${s.withName || 'a rival'}`
    : mine
      ? 'Yours'
      : `Held by ${cell.importedFrom?.name || 'another'}`;

  return (
    <div className="wager__shared">
      <p className="wager__shared-head">{head}</p>
      <div className="wager__shared-row">
        {/* Stroke, no fill, dash-array donut (claude.md §12). r makes the circumference
            100, so the dash length is the percentage directly. */}
        <svg viewBox="0 0 36 36" className="wager__shared-ring" width="44" height="44" aria-hidden>
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke={ENEMY_STROKE} strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke={OWN_STROKE}
            strokeWidth="3"
            strokeDasharray={`${minePct} 100`}
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div className="wager__shared-figures">
          <p className="wager__shared-split es-numeric">
            Yours {minePct}% · Theirs {100 - minePct}%
          </p>
          {/* Say what the split was worked out from, or the number is a verdict with no
              case behind it (PIVOT-2026-09-09 §5). Days are the rule; strength at import
              is the fallback for a tag written before days travelled. */}
          {s ? (
            <p className="wager__shared-why">
              {typeof s.myDays === 'number' && typeof s.theirDays === 'number' && s.myDays !== s.theirDays
                ? `You walked it on ${s.myDays} ${s.myDays === 1 ? 'day' : 'days'}, they on ${s.theirDays}.`
                : 'Split by the strength each side held when the message arrived.'}
            </p>
          ) : null}
        </div>
      </div>
      {s ? (
        <p className="cell-panel__note">
          The hourly yield splits the same way. Walk it on a new day to take it all back.
        </p>
      ) : null}
    </div>
  );
}
