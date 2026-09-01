/**
 * A field report, as one block of plain text (BRDC-BUGREPORT-001).
 *
 * No server until Phase 5, so the whole report is text the player shares to WhatsApp
 * (or the clipboard) themselves. This assembles it: what they wrote, then the context
 * that turns "it broke" into something actable — the build, roughly where they were, and
 * the last few things the game recorded.
 *
 * Location is rounded to three decimals (~110 m). A report is not a check-in.
 */
import type { LogEntry } from '@es3/core';
import { describeLogEntry, relativeTime } from '../log/describe.js';

export interface ReportContext {
  version: string;
  now: number;
  position: { lat: number; lng: number } | null;
  /** The tail of the action log, newest first. */
  log: readonly LogEntry[];
  /** What the player typed or said. */
  note: string;
}

const coarse = (n: number): string => n.toFixed(3);

export function buildReport({ version, now, position, log, note }: ReportContext): string {
  const where = position ? `${coarse(position.lat)}, ${coarse(position.lng)}` : 'unknown';
  const when = new Date(now).toISOString();
  const recent =
    log.length > 0
      ? log.slice(0, 5).map((e) => `  · ${relativeTime(e.at, now)} — ${describeLogEntry(e).text}`)
      : ['  · (nothing recorded yet)'];

  return [
    'Eldritch Sanctuary — field report',
    '',
    note.trim() || '(no description given)',
    '',
    '—',
    `build: v${version}`,
    `time: ${when}`,
    `near: ${where}`,
    'recent:',
    ...recent,
  ].join('\n');
}
