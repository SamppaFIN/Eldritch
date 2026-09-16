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
import { SAVE_VERSION, clearAll } from '@es3/core';
import type { GameRepository } from '@es3/core';

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

/**
 * Emptying the pouch (BRDC-ECON-005).
 *
 * Destructive, so it asks — but small: ground, buildings and research all survive, and
 * the trickle starts again from now. Opened from the menu, which owns its own state the
 * way it does for the changelog and the bug report.
 */
export function PouchResetDialog({ open, onConfirm, onCancel }: ResetDialogProps) {
  return (
    <Modal
      open={open}
      title="Empty the pouch?"
      onClose={onCancel}
      footer={
        <>
          <RitualButton variant="ghost" onClick={onConfirm}>
            Empty it
          </RitualButton>
          <RitualButton onClick={onCancel}>Keep what I have</RitualButton>
        </>
      }
    >
      <p>
        Every resource drops to zero. The ground you hold, what stands on it and what you
        have researched are untouched, and the trickle starts again from this moment.
      </p>
    </Modal>
  );
}

export interface SanctumDialogsProps {
  confirming: 'withdraw' | 'reset' | 'retire' | null;
  setConfirming: (v: 'withdraw' | 'reset' | 'retire' | null) => void;
  onLeave: () => void;
  repository: GameRepository;
  ownedCells: number;
  distanceM: number;
  /** For the retire confirm, which needs a timestamp `resetAll` never did (BRDC-HALL-001). */
  now: () => number;
}

/**
 * The withdraw and reset confirmations, and the state that opens them.
 *
 * Lifted out of MapView with their state so that file keeps under its line limit — the
 * two dialogs and the `confirming` flag are one concern and nothing else needs them.
 */
export function SanctumDialogs({
  confirming,
  setConfirming,
  onLeave,
  repository,
  ownedCells,
  distanceM,
  now,
}: SanctumDialogsProps) {
  return (
    <>
      <WithdrawDialog
        open={confirming === 'withdraw'}
        ownedCells={ownedCells}
        distanceM={distanceM}
        onConfirm={onLeave}
        onCancel={() => setConfirming(null)}
      />
      <ResetDialog
        open={confirming === 'reset'}
        onConfirm={() => {
          void (async () => {
            await repository.resetAll();
            // A full reload rather than clearing React state by hand: after a wipe there
            // is nothing to preserve, and rebuilding from boot is the one path already
            // tested a hundred times over.
            clearAll();
            window.location.reload();
          })();
        }}
        onCancel={() => setConfirming(null)}
      />
      <RetireDialog
        open={confirming === 'retire'}
        onConfirm={() => {
          void (async () => {
            await repository.retireKingdom(now());
            clearAll();
            window.location.reload();
          })();
        }}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}

/**
 * Retiring on purpose (BRDC-HALL-001) — a different door out than Delete progress, next to
 * it in the Advanced list but not styled as a mistake to be talked out of. What it takes is
 * the same wipe; what makes it not the panic button is that this kingdom is kept first.
 */
export function RetireDialog({ open, onConfirm, onCancel }: ResetDialogProps) {
  return (
    <Modal
      open={open}
      title="Retire this kingdom?"
      onClose={onCancel}
      footer={
        <>
          <RitualButton variant="ghost" className="es-btn--quiet" onClick={onConfirm}>
            Retire it
          </RitualButton>
          <RitualButton onClick={onCancel}>Keep building</RitualButton>
        </>
      }
    >
      <p>
        Every warded cell, every ley-line and all consciousness gained will be unmade — but
        this kingdom&rsquo;s name, level, ground held and what it achieved join the Hall of
        Fame first, kept there for good.
      </p>
      <p>A new kingdom begins the moment you confirm.</p>
    </Modal>
  );
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
