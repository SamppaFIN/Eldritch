/**
 * What is on this hex, with the marks the map draws for it (BRDC-DETAIL-002).
 *
 * Infinite: *"kuvakkeet mitä ruutu on, lisäresurssi, tai ihme mikä ruudulla on, rakennus
 * mikä ruudulla on ja sen kuvaus ja vaikutus"*.
 *
 * The card had all of this, scattered: the find named in one line, the Work's effect
 * inside the build list under Ward and Reveal, the place in a block of its own further
 * down. A player standing on a hex wants one answer to "what is here", near the top, and
 * the same glyph they just tapped on the map — so the card and the map agree by eye
 * rather than by reading.
 *
 * Each row is mark, name, and what it does. The Work gets its description as well as its
 * effect, because "Sawmill · +4 timber an hour" says what it pays and never what it is.
 */
import { bountyOn, worksOn } from '@es3/core';
import './cell-detail.css';
import type { Cell } from '@es3/core';
import { BOUNTY_GLYPH, BOUNTY_NAME, bountyLine } from './bounty.js';
import { BUILDING_BLURB, buildingEffect, renderEffect } from './catalogue.js';
import { buildingGlyph } from './buildingGlyphs.js';
import { BUILDING_NAME } from './names.js';

export interface CellOnProps {
  cell: Cell;
  /** A find is not shown until the ground has been revealed — found, never given. */
  revealed: boolean;
  /** The place this hex has become, if it has become one. */
  place: { kind: 'anchor' | 'temple' | null; rank: number };
}

export function CellOn({ cell, revealed, place }: CellOnProps) {
  const find = revealed ? bountyOn(cell) : null;
  const works = worksOn(cell);
  const hasPlace = place.kind !== null;
  if (!find && works.length === 0 && !hasPlace) return null;

  return (
    <ul className="cell-on" aria-label="What is on this hex">
      {hasPlace ? (
        <li className="cell-on__row">
          {/* Gold for a Temple, green for the Anchor — the map's own nimbus (Sigil §03). */}
          <span
            className="cell-on__mark"
            style={{ color: place.kind === 'anchor' ? '#00ff88' : '#ffd700' }}
            aria-hidden
          >
            ◈
          </span>
          <span className="cell-on__text">
            <span className="cell-on__name">
              {place.kind === 'anchor' ? 'Anchor Stone' : `Temple · rank ${place.rank}`}
            </span>
            <span className="cell-on__note">
              {place.kind === 'anchor'
                ? 'The heart of your realm. It pays mana and wisdom every hour.'
                : 'A place that teaches. Its element decides which Rite it can study.'}
            </span>
          </span>
        </li>
      ) : null}

      {find ? (
        <li className="cell-on__row">
          <span className="cell-on__mark" aria-hidden>
            {BOUNTY_GLYPH[find]}
          </span>
          <span className="cell-on__text">
            <span className="cell-on__name">{BOUNTY_NAME[find]}</span>
            <span className="cell-on__note">{bountyLine(find)}</span>
          </span>
        </li>
      ) : null}

      {works.map((work) => {
        const glyph = buildingGlyph(work.id);
        return (
          <li key={work.id} className="cell-on__row">
            <span className="cell-on__mark" style={{ color: glyph.color }} aria-hidden>
              {glyph.char}
            </span>
            <span className="cell-on__text">
              <span className="cell-on__name">{BUILDING_NAME[work.id]}</span>
              {/* What it is, then what it does. The build list only ever said the second. */}
              <span className="cell-on__note">{BUILDING_BLURB[work.id]}</span>
              <span className="cell-on__effect">{renderEffect(buildingEffect(work.id))}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
