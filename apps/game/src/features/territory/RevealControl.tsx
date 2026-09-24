/**
 * Reveal a held cell for its tier bonus, once (BRDC-CLAIM-009).
 *
 * A sub-panel of CellPanel, the shape `ConsecratePanel` is. Before: a button. After: the
 * tier in a sentence — the resources it paid landed in the pouch. The rare and legendary
 * tiers are *sites* whose content is `BRDC-EVENT-001` / `-WONDER-001`; this only says so.
 */
import { bountyOn, revealOf } from '@es3/core';
import type { Cell, H3Index } from '@es3/core';
import { bountyPickGlyph, bountyPickLine } from './bounty.js';

const TIER: Readonly<Record<ReturnType<typeof revealOf>, string>> = {
  common: 'Common ground — nothing hidden here.',
  uncommon: 'An uncommon find.',
  rare: 'A rare site. Something waits here.',
  legendary: 'A place of power. Something waits here.',
};

export interface RevealControlProps {
  h3: H3Index;
  /** The cell itself, so a revealed hex can name what is on it (BRDC-BOUNTY-001). */
  cell?: Cell;
}

/** What a revealed hex turned out to be. The Reveal button itself is in the card's action row. */
export function RevealControl({ h3, cell }: RevealControlProps) {
  const bounty = cell ? bountyOn(cell) : null;
  return (
    <>
      <p className="cell-panel__note">{TIER[revealOf(h3)]}</p>
      {bounty ? (
        <p className="cell-panel__bounty">
          <span aria-hidden>{bountyPickGlyph(bounty)}</span> {bountyPickLine(bounty)}
        </p>
      ) : null}
    </>
  );
}
