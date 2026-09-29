/**
 * Research, on its own (BRDC-KEEP-007).
 *
 * It was a tab inside the Keep and three field reports could not find it there. Now it is
 * a HUD footer button and a dialog of its own, the same shape as The Wager — a thing you
 * open on purpose, not something buried behind a scroll.
 *
 * A Season 2 save studies the Lore here instead (BRDC-PROG-004); a Season 1 save keeps
 * the old tree until the season closes.
 */
import { useEffect, useState } from 'react';
import { Modal, RitualButton } from '@es3/ui';
import type { GameRepository, LoreRow, LoreView, ResourcePool } from '@es3/core';
import { ResearchPanel } from './ResearchPanel.js';
import { LorePanel } from '../research/LorePanel.js';
import type { ResearchBinding } from './useSelection.js';

export interface ResearchDialogProps {
  open: boolean;
  research: ResearchBinding;
  /** The pouch, for the affordability check and the wait hint. */
  pool: ResourcePool | null;
  /** Forecast wisdom per hour (BRDC-STATS-001). */
  wisdomPerHour: number;
  onClose: () => void;
  /** Reads the Lore; absent in tests that only need the old tree. */
  repository?: GameRepository | null;
}

const REFUSAL: Record<string, string> = {
  'cannot-afford': 'Not enough wisdom yet.',
  sealed: 'That Age is still sealed. Learn three of this one first.',
  learned: 'Already learned.',
  'no-keep': 'This realm has no Keep yet.',
};

export function ResearchDialog({ open, research, pool, wisdomPerHour, onClose, repository = null }: ResearchDialogProps) {
  const [lore, setLore] = useState<LoreView | null>(null);

  useEffect(() => {
    if (open && repository) void repository.lore.view(Date.now()).then(setLore);
  }, [open, repository]);

  const study = async (row: LoreRow): Promise<string | null> => {
    if (!repository) return null;
    const r = await repository.lore.study(row.id, Date.now());
    setLore(await repository.lore.view(Date.now()));
    return r.ok ? `${row.name} learned.` : (REFUSAL[r.refused] ?? 'That did not work.');
  };

  return (
    <Modal
      open={open}
      title={lore ? 'The Lore' : 'Research'}
      onClose={onClose}
      footer={<RitualButton onClick={onClose}>Done</RitualButton>}
    >
      {lore ? (
        <LorePanel view={lore} onStudy={study} />
      ) : (
        <ResearchPanel research={research} pool={pool} wisdomPerHour={wisdomPerHour} />
      )}
    </Modal>
  );
}
