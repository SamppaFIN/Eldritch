/**
 * "New ground" — the screen a step-claim raises (BRDC-CLAIM-009).
 *
 * With the loop off, territory grows a hex at a time, and each new hex says so: a modal
 * with the ground's name, the button that reveals what it holds, and a way straight into
 * its detail card. It auto-dismisses in a few seconds — a step-claim lands about every
 * twenty-five metres and this must never be in the way of the next one.
 */
import { useEffect, useRef, useState } from 'react';
import { Modal, Rarity, RitualButton, HexMandala } from '@es3/ui';
import { revealOf, terrainForCell } from '@es3/core';
import type { Cell, H3Index } from '@es3/core';
import type { Discovery } from './useDiscovery.js';
import './discovery-modal.css';
import { GROUND_NAME } from './names.js';


/*
 * What each grade means, said in words beside its colour (BRDC-ART-005).
 *
 * These lost their tier adjectives when the grade moved into `Rarity`'s own eyebrow —
 * "Rare · A rare site" reads as a stutter. Each one now spends its sentence on what the
 * grade *gets you* instead, which is the part the tier word never said.
 */
const TIER: Readonly<Record<ReturnType<typeof revealOf>, string>> = {
  common: 'Ordinary ground, and it still pays.',
  uncommon: 'Worth more than the ground around it.',
  rare: 'Something waits here.',
  legendary: 'A place of power. Something waits here.',
};

const DISMISS_MS = 4500;

export interface DiscoveryModalProps {
  discovered: Discovery | null;
  owned: readonly Cell[];
  revealed: Readonly<Record<H3Index, number>>;
  onOpenCell: (h3: H3Index) => void;
  onReveal: (h3: H3Index) => void;
}

export function DiscoveryModal({
  discovered,
  owned,
  revealed,
  onOpenCell,
  onReveal,
}: DiscoveryModalProps) {
  const [shown, setShown] = useState<Discovery | null>(null);
  const seen = useRef(0);

  /*
   * A genuinely new discovery: show it.
   *
   * The chime used to be sounded here too. Since BRDC-CLAIM-013 a step-claim reports a
   * `ClaimEvent`, and `useClaimFeedback` sounds it for both ways of taking ground — so
   * doing it here as well rang the same claim twice and built a second `AudioContext`
   * per hex, which on a throttled phone is not free.
   */
  useEffect(() => {
    if (!discovered || discovered.at === seen.current) return;
    seen.current = discovered.at;
    setShown(discovered);
  }, [discovered]);

  // Auto-dismiss is armed off `shown`, not folded into the effect above — so any re-run
  // (a StrictMode remount included) re-arms it rather than leaving the screen up until it
  // is tapped. A step-claim lands about every 25 m.
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), DISMISS_MS);
    return () => clearTimeout(t);
  }, [shown]);

  if (!shown) return null;

  const cell = owned.find((c) => c.h3 === shown.h3);
  const isRevealed = revealed[shown.h3] !== undefined;
  const learning = owned.length <= 5;
  const close = () => setShown(null);

  return (
    <Modal
      open
      title="New ground"
      onClose={close}
      footer={<RitualButton variant="ghost" onClick={close}>Later</RitualButton>}
    >
      <span className="discovery__sigil" aria-hidden>
        <HexMandala size={110} animate={1400} />
      </span>

      <p className="discovery__ground">{cell ? GROUND_NAME[terrainForCell(cell).kind] : 'New ground'}</p>

      {learning ? (
        <p className="discovery__hint">
          You claimed this by walking into it. Keep walking — your land grows from its edges.
        </p>
      ) : null}

      {isRevealed ? (
        <Rarity tier={revealOf(shown.h3)} note={TIER[revealOf(shown.h3)]} />
      ) : (
        <RitualButton
          className="discovery__reveal"
          onClick={() => {
            onReveal(shown.h3);
          }}
        >
          Reveal what it holds
        </RitualButton>
      )}

      <RitualButton className="discovery__open" onClick={() => { onOpenCell(shown.h3); close(); }}>
        Open its card
      </RitualButton>
    </Modal>
  );
}
