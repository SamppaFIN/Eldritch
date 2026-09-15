/**
 * What this hex pays, and why (BRDC-DETAIL-002).
 *
 * Infinite: *"rakennus mikä ruudulla on ja sen kuvaus ja vaikutus.. yhteenlasketut luvut…
 * mutta että laskenta näkyy selkeästi ja miksi"*.
 *
 * So the total comes first — it is the answer — and the parts sit under it as the working,
 * each naming its own cause. Every figure is in its resource's colour, which is the one
 * rule that makes a dense block readable at walking pace (Sigil §01); a grey resource
 * number is a bug.
 *
 * The arithmetic is `cellIncome`, which composes the same rule functions the pouch settles
 * with. Nothing is computed here.
 */
import { RESOURCE_COLOUR, RESOURCE_WORD } from './territoryFeatures.js';
import { cellIncome } from './income.js';
import './cell-detail.css';
import type { Cell, H3Index, ResourceKind, TechId } from '@es3/core';

export interface CellIncomeProps {
  cell: Cell;
  revealed: Readonly<Record<H3Index, number>>;
  researched: readonly TechId[];
  now: number;
}

export function CellIncome({ cell, revealed, researched, now }: CellIncomeProps) {
  const { parts, total } = cellIncome(cell, revealed, researched, now);
  if (parts.length === 0) return null;

  const totals = Object.entries(total) as [ResourceKind, number][];

  return (
    <section className="cell-income" aria-label="What this hex pays">
      <p className="cell-income__total es-numeric">
        {totals.map(([resource, perHour], i) => (
          <span key={resource} style={{ color: RESOURCE_COLOUR[resource] }}>
            {i > 0 ? ' · ' : ''}
            {perHour} {RESOURCE_WORD[resource]}
          </span>
        ))}
        <span className="cell-income__unit"> an hour</span>
      </p>

      {/* The working. Shown whenever there is more than one source, because a single line
          that simply repeats the total above it is noise rather than an explanation. */}
      {parts.length > 1 ? (
        <ul className="cell-income__parts">
          {parts.map((part) => (
            <li key={`${part.from}-${part.resource}`} className="cell-income__part">
              <span className="cell-income__from">{part.from}</span>
              <span className="cell-income__figure es-numeric" style={{ color: RESOURCE_COLOUR[part.resource] }}>
                +{part.perHour} {RESOURCE_WORD[part.resource]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
