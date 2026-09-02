/**
 * Where a cell's picture came from, when it was not this device (BRDC-WAGER-JSON-004).
 *
 * A Wager message or `world.json` carries the owner's nation, flag and the moment they
 * sealed it. The panel says so plainly — this ground is intel, dated, not something you
 * are watching happen.
 */
import type { Cell } from '@es3/core';
import { Banner } from '../nation/Banner.js';
import { resolveBannerId } from '../nation/nation.js';
import { relativeTime } from '../log/describe.js';

export interface ImportedNoteProps {
  from: NonNullable<Cell['importedFrom']>;
  now: number;
}

export function ImportedNote({ from, now }: ImportedNoteProps) {
  return (
    <div className="cell-panel__imported">
      <Banner id={resolveBannerId(from.banner)} size={22} />
      <p className="cell-panel__imported-text">
        Held by {from.name || 'an unnamed reach'}.{' '}
        <span className="cell-panel__source">as they saw it, {relativeTime(from.seenAt, now)}</span>
      </p>
    </div>
  );
}
