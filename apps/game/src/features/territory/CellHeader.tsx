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
import { cityStateOf, hexSeedOf, terrainForCell } from '@es3/core';
import type { Cell, TerrainKind, Terrain } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { terrainGlyph } from './territoryFeatures.js';
import { GROUND_NAME } from './names.js';

/**
 * Whether this ground is known, not guessed (BRDC-CARD-001, `types/hexSeed.ts`'s own
 * pointer: *"confidence < 0.5 shows the grey '?' badge"*). Real map data or a hand-painted
 * hex are definitionally certain; a Worldseed hex carries its own classifier confidence —
 * 0.9 inside a mapped zone, 0.4 for "not in any zone", the fallback `worldseedTerrain.ts`
 * itself calls untrustworthy; anywhere else, the hash is a guess with nothing to check it
 * against, the same "the map admits it does not know" this ticket asks for.
 */
export function surveyed(cell: Cell, terrain: Terrain): boolean {
  if (terrain.source === 'tiles') return true;
  if (terrain.source === 'hash') return false;
  return (hexSeedOf(cell.h3)?.confidence ?? 0) >= 0.5;
}

const YIELD: Readonly<Record<TerrainKind, string>> = {
  plain: 'yields nothing',
  forest: 'yields timber',
  hill: 'yields stone',
  mountain: 'yields iron',
  lake: 'yields food',
  coast: 'yields food',
  market: 'yields gold',
  marsh: 'yields food',
  settlement: 'yields gold',
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
  const known = surveyed(cell, terrain);

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
            {GROUND_NAME[terrain.kind]}
          </p>
          {/* Who holds it and whether the player is standing on it — the line most worth
              a glance, so it sits right under the ground's name, not shared with the yield
              sentence below it. Colour is a second channel, not the only one: the words
              "Yours"/"Unclaimed"/a name already differ (AI-Koulu ch.4). */}
          <p className="cell-panel__owner cell-panel__tags">
            {/* "The map admits it does not know" (BRDC-CARD-001) rather than stating a
                guessed terrain as fact — first, the way the model's own chip row leads. */}
            <span className={`cell-panel__tag${known ? '' : ' cell-panel__tag--unsure'}`}>
              {known ? 'Surveyed' : '?'}
            </span>
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
