/**
 * One cell, up close.
 *
 * Tapping a hexagon has done nothing until now, which is a strange thing on a map made
 * entirely of hexagons. This is what it does: says what the ground is, who holds it, how
 * long it has left — and offers the first thing resources are for.
 *
 * Deliberately not a modal. The player is walking; a dialog that traps focus and demands
 * dismissal is the wrong shape for something you glance at and put away.
 */
import { MAX_STRENGTH, WARD_COST, hoursUntilReleased, terrainOf } from '@es3/core';
import type { Cell, PlayerId, ResourcePool, TerrainKind, WardRefusal } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import './cell-panel.css';

export interface CellPanelProps {
  cell: Cell | null;
  me: PlayerId | null;
  resources: ResourcePool | null;
  now: number;
  /** Null while a ward is in flight, then the refusal if there was one. */
  refusal: WardRefusal | null;
  onWard: (h3: string) => void;
  onClose: () => void;
}

const GROUND: Readonly<Record<TerrainKind, string>> = {
  water: 'Still water',
  forest: 'Old woodland',
  market: 'A place of trade',
  plain: 'Plain ground',
};

const YIELD: Readonly<Record<TerrainKind, string>> = {
  water: 'yields water',
  forest: 'yields timber',
  market: 'yields gold',
  plain: 'yields nothing',
};

/** Errors say what to do, not what failed (AI-Koulu ch.3). */
const REFUSAL: Readonly<Record<WardRefusal, string>> = {
  'not-yours': 'You do not hold this ground. Walk it to take it.',
  'already-full': 'This cell is already as strong as it can be.',
  'cannot-afford': `A ward costs ${WARD_COST.wood} timber. Claim woodland to gather it.`,
};

/**
 * Hours left, counted from the last visit rather than from full strength.
 *
 * `hoursUntilReleased` answers "how long does this strength last", which is a span, not
 * a deadline. The time already spent decaying has to come off it or every cell would
 * claim a fresh two-day grace on every glance.
 */
function hoursLeft(cell: Cell, now: number): number {
  return hoursUntilReleased(cell.strength) - (now - cell.lastVisitedAt) / 3_600_000;
}

function remaining(hours: number): string {
  if (hours <= 1) return 'The Void takes it within the hour';
  if (hours < 48) return `The Void takes it in ${Math.round(hours)} h`;
  return `The Void takes it in ${Math.round(hours / 24)} days`;
}

export function CellPanel({ cell, me, resources, now, refusal, onWard, onClose }: CellPanelProps) {
  if (!cell) return null;

  const terrain = terrainOf(cell.h3);
  const mine = cell.ownerId !== null && cell.ownerId === me;
  const wood = resources?.wood ?? 0;
  const canWard = mine && cell.strength < MAX_STRENGTH && wood >= (WARD_COST.wood ?? 0);

  return (
    <GlassPanel as="section" className="cell-panel" aria-label="Selected cell">
      <div className="cell-panel__head">
        <div>
          <p className="cell-panel__ground">{GROUND[terrain]}</p>
          <p className="cell-panel__yield">{YIELD[terrain]}</p>
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

      <p className="cell-panel__owner">
        {mine ? 'Yours' : cell.ownerId === null ? 'Unclaimed' : 'Held by another'}
      </p>

      {cell.ownerId !== null ? (
        <>
          {/* The bar is decoration; the number beside it is the information. Colour and
              length never carry this alone. */}
          <div className="cell-panel__bar" aria-hidden>
            <div
              className="cell-panel__bar-fill"
              style={{ inlineSize: `${(cell.strength / MAX_STRENGTH) * 100}%` }}
            />
          </div>
          <p className="cell-panel__strength es-numeric">
            {Math.round(cell.strength)} / {MAX_STRENGTH}
          </p>
          <p className="cell-panel__decay">{remaining(hoursLeft(cell, now))}</p>
        </>
      ) : null}

      {mine ? (
        <>
          <RitualButton className="cell-panel__ward" disabled={!canWard} onClick={() => onWard(cell.h3)}>
            Ward · {WARD_COST.wood} timber
          </RitualButton>
          {/* Warding is the one place a player can hold ground without walking to it, so
              the limit of that is stated where the button is, not buried in a codex. */}
          <p className="cell-panel__note">
            A ward adds strength. It does not reset the clock — only your feet do that.
          </p>
        </>
      ) : null}

      {refusal ? (
        <p className="cell-panel__refusal" role="status">
          {REFUSAL[refusal]}
        </p>
      ) : null}
    </GlassPanel>
  );
}
