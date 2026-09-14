/**
 * The cell panel's identity block: what the ground is, who holds it, whether the player
 * is standing on it, and what it yields — lifted out of `CellPanel` to keep that file
 * under its line limit (BRDC-DETAIL-001's own GREEN: a planned split when the limit is
 * hit, not an emergency one).
 *
 * Order is the point of this file. The ground's name comes first, the who/here tags sit
 * directly under it — not sharing a line with the yield sentence, which used to bury
 * "You are here" inside "yields stone" — and the yield gets its own colour-coded banner
 * below the head, in the same hue the map already paints the terrain glyph.
 */
import { cityStateOf, terrainForCell } from '@es3/core';
import type { Cell, TerrainKind } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { terrainGlyph } from './territoryFeatures.js';

const GROUND: Readonly<Record<TerrainKind, string>> = {
  plain: 'Plain ground',
  forest: 'Old woodland',
  hill: 'Bare hillside',
  mountain: 'Broken rock',
  lake: 'Still water',
  coast: 'The shoreline',
  market: 'A place of trade',
};

/** Where the terrain reading came from (BRDC-TERRAIN-002, -003). */
const SOURCE_LABEL = { tiles: '(from the map)', seed: '(surveyed)', hash: '(estimated)' } as const;

const YIELD: Readonly<Record<TerrainKind, string>> = {
  plain: 'yields nothing',
  forest: 'yields timber',
  hill: 'yields stone',
  mountain: 'yields iron',
  lake: 'yields food',
  coast: 'yields food',
  market: 'yields gold',
};

export interface CellHeaderProps {
  cell: Cell;
  /** Whether the local player holds this cell — computed once by `CellPanel`. */
  mine: boolean;
  /** True when this is the cell the player is standing in. */
  here: boolean;
  onClose: () => void;
}

export function CellHeader({ cell, mine, here, onClose }: CellHeaderProps) {
  const terrain = terrainForCell(cell);
  const glyph = terrainGlyph(terrain.kind);

  return (
    <>
      <div className="cell-panel__head">
        <div className="cell-panel__identity">
          <p className="cell-panel__ground">
            {glyph ? (
              <span
                className="cell-panel__terrain-icon"
                style={{ color: glyph.color }}
                aria-hidden
              >
                {glyph.char}{' '}
              </span>
            ) : null}
            {GROUND[terrain.kind]}
            <span className="cell-panel__source"> {SOURCE_LABEL[terrain.source]}</span>
          </p>
          {/* Who holds it and whether the player is standing on it — the line most worth
              a glance, so it sits right under the ground's name, not shared with the yield
              sentence below it. Colour is a second channel, not the only one: the words
              "Yours"/"Unclaimed"/a name already differ (AI-Koulu ch.4). */}
          <p className="cell-panel__owner cell-panel__tags">
            {here ? <span className="cell-panel__tag cell-panel__tag--here">Here</span> : null}
            <span
              className={`cell-panel__tag${
                mine ? ' cell-panel__tag--mine' : cell.ownerId !== null ? ' cell-panel__tag--rival' : ''
              }`}
            >
              {mine
                ? 'Yours'
                : cell.ownerId === null
                  ? 'Unclaimed'
                  : (cityStateOf(cell.ownerId)?.name ?? 'Held by another')}
            </span>
            {/* Separate arrivals, not fixes — standing still is one (BRDC-HEX-002). */}
            {cell.visits ? (
              <span className="cell-panel__visits es-numeric">
                {cell.visits} {cell.visits === 1 ? 'visit' : 'visits'}
              </span>
            ) : null}
          </p>
        </div>
        <RitualButton
          variant="ghost"
          className="cell-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {/* The resource banner: what this ground yields, in the same colour the map already
          paints its glyph — the law says a resource number is never grey (Sigil §01). */}
      <p className="cell-panel__yield" style={glyph ? { color: glyph.color } : undefined}>
        {YIELD[terrain.kind]}
      </p>
    </>
  );
}
