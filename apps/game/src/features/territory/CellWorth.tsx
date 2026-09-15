/**
 * What a cell is worth to hold, and how it is faring — lifted out of `CellPanel` to keep
 * that file under its line limit.
 *
 * The yield and the neighbour bonus (invisible everywhere else), then — only for an owned
 * cell whose detail is shown (BRDC-WAGER-JSON-007) — the strength bar and the decay clock.
 *
 * BRDC-DETAIL-001: this used to restate the same yield and neighbour numbers a second
 * time, in prose, directly under the `<dl>` that already said them. One place per number.
 */
import {
  CLAIM_YIELD,
  MAX_STRENGTH,
  NEIGHBOUR_BONUS,
  TRICKLE_PER_HOUR,
  cellAreaM2,
  hoursUntilReleased,
  isCityState,
  resourceForCell,
  worksOn,
} from '@es3/core';
import type { Cell } from '@es3/core';
import { RESOURCE_COLOUR, RESOURCE_WORD } from './territoryFeatures.js';

/** Hours left, counted from the last visit, not from full strength — the time already
 *  spent decaying has to come off or every glance would claim a fresh two-day grace. */
function hoursLeft(cell: Cell, now: number): number {
  return hoursUntilReleased(cell.strength) - (now - cell.lastVisitedAt) / 3_600_000;
}

function remaining(hours: number): string {
  if (hours <= 1) return 'The Void takes it within the hour';
  if (hours < 48) return `The Void takes it in ${Math.round(hours)} h`;
  return `The Void takes it in ${Math.round(hours / 24)} days`;
}

export interface CellWorthProps {
  cell: Cell;
  now: number;
  /** Show the strength bar and decay clock — off for a rival cell you have not scouted. */
  showDetail: boolean;
}

export function CellWorth({ cell, now, showDetail }: CellWorthProps) {
  const resource = resourceForCell(cell);
  // A Fortress on this very hex protects it (BRDC-BUILD-012). Neighbours it protects
  // cannot be told apart from here: this panel is handed one cell.
  const standsFortress = worksOn(cell).some((w) => w.id === 'fortress');
  return (
    <>
      <dl className="cell-panel__worth">
        <div>
          <dt>Ground</dt>
          <dd className="es-numeric">{Math.round(cellAreaM2(cell.h3))} m²</dd>
        </div>
        <div>
          <dt>Yields</dt>
          {/* Same colour law as the resource banner above this panel and the map's own
              glyph — a resource number is never left grey (Sigil §01, BRDC-DETAIL-001). */}
          <dd className="es-numeric" style={resource ? { color: RESOURCE_COLOUR[resource] } : undefined}>
            {resource ? `${CLAIM_YIELD} ${RESOURCE_WORD[resource]} · ${TRICKLE_PER_HOUR}/h` : 'nothing'}
          </dd>
        </div>
        <div>
          <dt>Neighbours</dt>
          <dd className="es-numeric">+{NEIGHBOUR_BONUS} each</dd>
        </div>
        {/* Separate days walked, not visits (PIVOT-2026-09-09 §5). It is the basis of the
            share on a contested hex, so it belongs with the basics rather than tacked onto
            the end of the history sentence, which is where it used to live. */}
        <div>
          <dt>Walked</dt>
          <dd className="es-numeric">
            {cell.ownedDays ? `${cell.ownedDays} ${cell.ownedDays === 1 ? 'day' : 'days'}` : '—'}
          </dd>
        </div>
      </dl>

      {cell.ownerId !== null && showDetail ? (
        <>
          {/* The bar is decoration; the number is the information — colour never carries this alone. */}
          <div className="cell-panel__bar" aria-hidden>
            <div
              className="cell-panel__bar-fill"
              style={{ inlineSize: `${(cell.strength / MAX_STRENGTH) * 100}%` }}
            />
          </div>
          <p className="cell-panel__strength es-numeric">
            {Math.round(cell.strength)} / {MAX_STRENGTH}
          </p>
          {/* Ground that cannot be lost gets no countdown — a clock on a village that
              never rots is a lie with a number on it (BRDC-DIPLO-001, BRDC-LANDS-001). */}
          {isCityState(cell.ownerId) ? (
            <p className="cell-panel__decay">Held for good — the Void has no claim here.</p>
          ) : standsFortress ? (
            <p className="cell-panel__decay">
              {cell.breachedOn
                ? 'Its Fortress is breached. Broken through again on another day, it falls.'
                : 'Its Fortress holds it: worn down, never taken, and the Void has no claim.'}
            </p>
          ) : (
            <p className="cell-panel__decay">{remaining(hoursLeft(cell, now))}</p>
          )}
        </>
      ) : null}
    </>
  );
}
