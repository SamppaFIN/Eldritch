/**
 * A cell's ownership history (BRDC-HEX-001).
 *
 * `resolveCapture` already knows who took a cell, from whom, and with how much force — it
 * just discarded it. This keeps it, as a bounded list attached to the cell, so loyalty
 * (`BRDC-BUILD-003`), achievements and stats have the data they all assume exists. The
 * shape matches the Phase 3 `cell_history` table; only the home is different.
 */
import { MAX_CELL_HISTORY } from './constants.js';
import type { OwnershipChange } from '../types/domain.js';

export type { OwnershipChange } from '../types/domain.js';

/**
 * Append one change, oldest first, keeping only the last `MAX_CELL_HISTORY`.
 *
 * The oldest entries fall off — a border cell fought over fifty times keeps the fifty
 * that matter now, not a ledger back to the first claim.
 */
export function appendChange(
  history: readonly OwnershipChange[] | undefined,
  change: OwnershipChange,
): OwnershipChange[] {
  return [...(history ?? []), change].slice(-MAX_CELL_HISTORY);
}
