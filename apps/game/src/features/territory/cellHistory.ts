/**
 * The last thing that happened to a cell, in a sentence (BRDC-HEX-001).
 *
 * Lifted out of `CellPanel` when that file hit its line limit. Pure. The client has ids,
 * not names, so anyone who is not the local player reads as "another wanderer"; unowned
 * ground it was claimed from is "the Void".
 */
import { daysBetween } from '@es3/core';
import type { Cell, PlayerId } from '@es3/core';

/** "3 days ago", "yesterday", "today" — from a day count. */
export function ago(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function historyLine(cell: Cell, me: PlayerId | null, now: number): string | null {
  const last = cell.history?.[cell.history.length - 1];
  if (last) {
    const when = ago(daysBetween(last.at, now));
    if (last.from === null) {
      return last.to === me ? `You claimed this from the Void ${when}` : `Claimed from the Void ${when}`;
    }
    return last.to === me ? `You took this ${when}` : `Taken from another wanderer ${when}`;
  }
  if (cell.finder === me) return 'You revealed this';
  if (cell.finder) return 'Revealed by another wanderer';
  return null;
}
