/**
 * The two dialogs the game owes its player.
 *
 * Withdrawing ends a walk in progress, and resetting throws away everything. Both are
 * destructive, and claude.md §14 is explicit: destructive actions get a confirmation,
 * and errors say what to do rather than what failed.
 *
 * The reset is not a nicety. v2 had no way out of a corrupt save — the level-118 player
 * was stuck with it, and the only advice anyone could give was "open the console and
 * call localStorage.clear()". A game that can put itself in a bad state and offers no
 * door out is a game people stop opening.
 */
import { Modal, RitualButton } from '@es3/ui';
import { SAVE_VERSION } from '@es3/core';

export interface WithdrawDialogProps {
  open: boolean;
  /** Cells held, so the player knows what they are walking away from mid-run. */
  ownedCells: number;
  distanceM: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WithdrawDialog({
  open,
  ownedCells,
  distanceM,
  onConfirm,
  onCancel,
}: WithdrawDialogProps) {
  return (
    <Modal
      open={open}
      title="Withdraw from the walk?"
      onClose={onCancel}
      footer={
        <>
          <RitualButton variant="ghost" onClick={onConfirm}>
            Withdraw
          </RitualButton>
          <RitualButton onClick={onCancel}>Keep walking</RitualButton>
        </>
      }
    >
      <p>
        Your ley-line so far is {Math.round(distanceM)} m and has not closed. Withdrawing
        ends this walk; the ground you already hold stays yours.
      </p>
      {ownedCells > 0 ? (
        <p>
          You hold {ownedCells} {ownedCells === 1 ? 'warded cell' : 'warded cells'}. They
          will fade if nobody walks them.
        </p>
      ) : null}
    </Modal>
  );
}

export interface ResetDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetDialog({ open, onConfirm, onCancel }: ResetDialogProps) {
  return (
    <Modal
      open={open}
      title="Return everything to the Void?"
      onClose={onCancel}
      footer={
        <>
          {/* The safe option is the prominent one. Red and filled is how you make a
              destructive button the thing an eye lands on first, which is a poor way
              to honour a rule that exists to slow someone down. */}
          <RitualButton variant="danger" className="es-btn--quiet" onClick={onConfirm}>
            Return it all
          </RitualButton>
          <RitualButton onClick={onCancel}>Keep my sanctuary</RitualButton>
        </>
      }
    >
      <p>
        Every warded cell, every ley-line and all consciousness gained will be unmade.
        This cannot be undone, and nothing is kept anywhere else.
      </p>
      <p className="sanctum__meta es-numeric">Save format v{SAVE_VERSION}</p>
    </Modal>
  );
}
