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
import {
  ANCHOR_THRESHOLD_MS,
  MAX_STRENGTH,
  TEMPLE_THRESHOLD_MS,
  WARD_COST,
  hoursUntilReleased,
  revealProgress,
  terrainOf,
} from '@es3/core';
import type { Cell, PlayerId, ResourcePool, TerrainKind, WardRefusal } from '@es3/core';
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import './cell-panel.css';

export interface CellPanelProps {
  cell: Cell | null;
  me: PlayerId | null;
  resources: ResourcePool | null;
  now: number;
  /** Null while a ward is in flight, then the refusal if there was one. */
  refusal: WardRefusal | null;
  /** True when this is the cell the player is standing in. */
  here?: boolean;
  /** Time accumulated in this cell, for the reveal progress. */
  dwellMs?: number;
  /** Whether an Anchor already exists, which decides what this cell could become. */
  hasAnchor?: boolean;
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

/** Minutes, said the way someone standing in the rain would say them. */
function spent(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min here`;
  const hours = ms / 3_600_000;
  return `${hours.toFixed(1)} h here`;
}

export function CellPanel({
  cell,
  me,
  resources,
  now,
  refusal,
  here = false,
  dwellMs = 0,
  hasAnchor = false,
  onWard,
  onClose,
}: CellPanelProps) {
  /*
   * Focus follows the panel when it opens.
   *
   * Not a focus trap — this is a disclosure, not a modal, and the player is walking. But
   * something that appears in response to a button has to be findable from the keyboard
   * afterwards, and announced when it arrives.
   */
  const panelRef = useRef<HTMLElement>(null);
  const h3 = cell?.h3 ?? null;
  useEffect(() => {
    if (h3) panelRef.current?.focus();
  }, [h3]);

  if (!cell) return null;

  const terrain = terrainOf(cell.h3);
  const mine = cell.ownerId !== null && cell.ownerId === me;
  const wood = resources?.wood ?? 0;
  const canWard = mine && cell.strength < MAX_STRENGTH && wood >= (WARD_COST.wood ?? 0);

  return (
    <GlassPanel
      as="section"
      ref={panelRef}
      className="cell-panel"
      aria-label="Selected cell"
      tabIndex={-1}
    >
      <div className="cell-panel__head">
        <div>
          <p className="cell-panel__ground">{GROUND[terrain]}</p>
          <p className="cell-panel__yield">
            {here ? 'You are here · ' : ''}
            {YIELD[terrain]}
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

      {/*
        "This place is becoming something" beats silence followed by a sudden crowning.
        The dwell mechanic is otherwise entirely invisible until it fires, and a player
        who never saw it coming does not understand what they did to cause it.
      */}
      {dwellMs > 0 ? (
        <>
          <div className="cell-panel__bar cell-panel__bar--dwell" aria-hidden>
            <div
              className="cell-panel__bar-fill"
              style={{ inlineSize: `${revealProgress(dwellMs, hasAnchor) * 100}%` }}
            />
          </div>
          <p className="cell-panel__dwell">
            {spent(dwellMs)}
            {dwellMs >= (hasAnchor ? TEMPLE_THRESHOLD_MS : ANCHOR_THRESHOLD_MS)
              ? ' — this place has a name'
              : hasAnchor
                ? ' — stay longer and it becomes a temple'
                : ' — stay longer and the ground learns you'}
          </p>
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
