/**
 * The action log (BRDC-LOG-001).
 *
 * `cell.history` records what happened to one cell; this records what the *player* did,
 * across everything — claims, builds, losses, Wagers — as a bounded list they can scroll
 * back through.
 *
 * Entries are data, not sentences. Core cannot spell "Built a Sawmill" — building and
 * technology names live in the app — so an entry carries a `kind` and a slug, and the
 * app turns it into a line. Same division `cell.history` already makes with
 * `OwnershipChange`.
 */
import { MAX_LOG_ENTRIES } from './constants.js';

export type LogKind =
  | 'awaken'
  | 'corrupt'
  | 'reinforce'
  | 'reclaim'
  | 'build'
  | 'demolish'
  | 'research'
  | 'spell'
  | 'ward'
  | 'route'
  | 'expand'
  | 'mana'
  | 'anomaly'
  | 'quest'
  | 'wager'
  | 'hearth';

export interface LogEntry {
  at: number;
  kind: LogKind;
  /** A slug the app resolves to a name — a building / tech / spell id, or an opponent. */
  ref?: string;
  /** How many cells, for the territory kinds. */
  count?: number;
  /** The result of a Wager. */
  won?: boolean;
}

/**
 * Append one entry, oldest first, keeping only the last `cap`.
 *
 * The oldest fall off the bottom — a scroll back through a few weeks of play, not a
 * ledger to the first step.
 */
export function appendLog(
  log: readonly LogEntry[] | undefined,
  entry: LogEntry,
  cap: number = MAX_LOG_ENTRIES,
): LogEntry[] {
  return [...(log ?? []), entry].slice(-cap);
}
