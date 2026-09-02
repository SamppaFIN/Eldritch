/**
 * "New ground" — the screen a step-claim raises (BRDC-CLAIM-009).
 *
 * With the loop off, territory grows a hex at a time, and each new hex says so: a modal
 * with the ground's name, the button that reveals what it holds, and a way straight into
 * its detail card. It auto-dismisses in a few seconds — a step-claim lands about every
 * twenty-five metres and this must never be in the way of the next one.
 */
import { useEffect, useRef, useState } from 'react';
import { Modal, RitualButton, HexMandala } from '@es3/ui';
import { revealOf, terrainForCell } from '@es3/core';
import type { Cell, H3Index, TerrainKind } from '@es3/core';
import { playChime } from '../hud/useClaimFeedback.js';
import type { Settings } from '../hud/settings.js';
import type { Discovery } from './useDiscovery.js';
import './discovery-modal.css';

const GROUND: Readonly<Record<TerrainKind, string>> = {
  plain: 'Plain ground',
  forest: 'Old woodland',
  hill: 'A bare hillside',
  mountain: 'Broken rock',
  lake: 'Still water',
  coast: 'The shoreline',
  market: 'A place of trade',
};

const TIER: Readonly<Record<ReturnType<typeof revealOf>, string>> = {
  common: 'Common ground.',
  uncommon: 'An uncommon find.',
  rare: 'A rare site — something waits here.',
  legendary: 'A place of power. Something waits here.',
};

const DISMISS_MS = 4500;

export interface DiscoveryModalProps {
  discovered: Discovery | null;
  owned: readonly Cell[];
  revealed: Readonly<Record<H3Index, number>>;
  onOpenCell: (h3: H3Index) => void;
  onReveal: (h3: H3Index) => void;
  settings: Settings;
}

export function DiscoveryModal({
  discovered,
  owned,
  revealed,
  onOpenCell,
  onReveal,
  settings,
}: DiscoveryModalProps) {
  const [shown, setShown] = useState<Discovery | null>(null);
  const seen = useRef(0);

  useEffect(() => {
    if (!discovered || discovered.at === seen.current) return;
    seen.current = discovered.at;
    setShown(discovered);
    if (settings.sound) playChime('claimed');
    const t = setTimeout(() => setShown(null), DISMISS_MS);
    return () => clearTimeout(t);
  }, [discovered, settings.sound]);

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

      <p className="discovery__ground">{cell ? GROUND[terrainForCell(cell).kind] : 'New ground'}</p>

      {learning ? (
        <p className="discovery__hint">
          You claimed this by walking into it. Keep walking — your land grows from its edges.
        </p>
      ) : null}

      {isRevealed ? (
        <p className="discovery__tier">{TIER[revealOf(shown.h3)]}</p>
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
