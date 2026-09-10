/**
 * Reveal a held cell for its tier bonus, once (BRDC-CLAIM-009).
 *
 * A sub-panel of CellPanel, the shape `ConsecratePanel` is. Before: a button. After: the
 * tier in a sentence — the resources it paid landed in the pouch. The rare and legendary
 * tiers are *sites* whose content is `BRDC-EVENT-001` / `-WONDER-001`; this only says so.
 */
import { bountyOn, revealOf } from '@es3/core';
import type { Cell, H3Index } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BOUNTY_GLYPH, UNSEEN_BOUNTY, bountyLine } from './bounty.js';

const TIER: Readonly<Record<ReturnType<typeof revealOf>, string>> = {
  common: 'Common ground — nothing hidden here.',
  uncommon: 'An uncommon find.',
  rare: 'A rare site. Something waits here.',
  legendary: 'A place of power. Something waits here.',
};

export interface RevealControlProps {
  h3: H3Index;
  revealed: boolean;
  /** The cell itself, so a revealed hex can name what is on it (BRDC-BOUNTY-001). */
  cell?: Cell;
  onReveal: (h3: H3Index) => void;
}

export function RevealControl({ h3, revealed, cell, onReveal }: RevealControlProps) {
  if (!revealed) {
    return (
      <>
        <RitualButton className="cell-panel__expand" onClick={() => onReveal(h3)}>
          Reveal this ground
        </RitualButton>
        {/* Revealing was a one-off payout; a bounty makes it discovery, so the button
            says there is something to discover (BRDC-BOUNTY-001). */}
        <p className="cell-panel__note">{UNSEEN_BOUNTY}</p>
      </>
    );
  }

  const bounty = cell ? bountyOn(cell) : null;
  return (
    <>
      <p className="cell-panel__note">{TIER[revealOf(h3)]}</p>
      {bounty ? (
        <p className="cell-panel__bounty">
          <span aria-hidden>{BOUNTY_GLYPH[bounty]}</span> {bountyLine(bounty)}
        </p>
      ) : null}
    </>
  );
}
