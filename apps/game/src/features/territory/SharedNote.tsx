/**
 * A cell both you and an imported Wager claim (BRDC-WAGER-JSON-006).
 *
 * It stays yours — a text message cannot take ground — but the hourly yield is split.
 * This says with whom, and each side's share, as a small ring: your slice in the same
 * purple the map paints your ground, theirs in the same rival red. No new legend.
 *
 * Rendered inside `CellPanel`; styled from `wager.css`, which is always bundled.
 */
import { localShare } from '@es3/core';
import type { Cell } from '@es3/core';
import { OWN_STROKE, ENEMY_STROKE } from './territoryFeatures.js';

export interface SharedNoteProps {
  cell: Cell;
}

export function SharedNote({ cell }: SharedNoteProps) {
  const s = cell.shared;
  if (!s) return null;

  const mine = Math.round(localShare(cell) * 100);

  return (
    <div className="wager__shared">
      <p className="wager__shared-head">Shared with {s.withName || 'a rival'}</p>
      <div className="wager__shared-row">
        {/* Stroke, no fill, dash-array donut (claude.md §12). r is chosen so the
            circumference is 100 and the dash length is the percentage directly. */}
        <svg viewBox="0 0 36 36" className="wager__shared-ring" width="44" height="44" aria-hidden>
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke={ENEMY_STROKE} strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke={OWN_STROKE}
            strokeWidth="3"
            strokeDasharray={`${mine} 100`}
            transform="rotate(-90 18 18)"
          />
        </svg>
        <p className="wager__shared-split es-numeric">
          Yours {mine}% · Theirs {100 - mine}%
        </p>
      </div>
      <p className="cell-panel__note">
        The hourly yield splits the same way. Walk it on a new day to take it all back.
      </p>
    </div>
  );
}
