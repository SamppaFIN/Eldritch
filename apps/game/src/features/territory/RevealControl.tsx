/**
 * Reveal a held cell for its tier bonus, once (BRDC-CLAIM-009).
 *
 * A sub-panel of CellPanel, the shape `ConsecratePanel` is. Before: a button. After: the
 * tier in a sentence — the resources it paid landed in the pouch. The rare and legendary
 * tiers are *sites* whose content is `BRDC-EVENT-001` / `-WONDER-001`; this only says so.
 */
import { revealOf } from '@es3/core';
import type { H3Index } from '@es3/core';
import { RitualButton } from '@es3/ui';

const TIER: Readonly<Record<ReturnType<typeof revealOf>, string>> = {
  common: 'Common ground — nothing hidden here.',
  uncommon: 'An uncommon find.',
  rare: 'A rare site. Something waits here.',
  legendary: 'A place of power. Something waits here.',
};

export interface RevealControlProps {
  h3: H3Index;
  revealed: boolean;
  onReveal: (h3: H3Index) => void;
}

export function RevealControl({ h3, revealed, onReveal }: RevealControlProps) {
  if (revealed) return <p className="cell-panel__note">{TIER[revealOf(h3)]}</p>;
  return (
    <RitualButton className="cell-panel__expand" onClick={() => onReveal(h3)}>
      Reveal this ground
    </RitualButton>
  );
}
