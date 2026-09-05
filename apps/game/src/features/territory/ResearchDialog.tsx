/**
 * Research, on its own (BRDC-KEEP-007).
 *
 * It was a tab inside the Keep and three field reports could not find it there. Now it is
 * a HUD footer button and a dialog of its own, the same shape as The Wager — a thing you
 * open on purpose, not something buried behind a scroll.
 */
import { Modal, RitualButton } from '@es3/ui';
import type { ResourcePool } from '@es3/core';
import { ResearchPanel } from './ResearchPanel.js';
import type { ResearchBinding } from './useSelection.js';

export interface ResearchDialogProps {
  open: boolean;
  research: ResearchBinding;
  /** The pouch, for the affordability check and the wait hint. */
  pool: ResourcePool | null;
  /** Forecast wisdom per hour (BRDC-STATS-001). */
  wisdomPerHour: number;
  onClose: () => void;
}

export function ResearchDialog({ open, research, pool, wisdomPerHour, onClose }: ResearchDialogProps) {
  return (
    <Modal
      open={open}
      title="Research"
      onClose={onClose}
      footer={<RitualButton onClick={onClose}>Done</RitualButton>}
    >
      <ResearchPanel research={research} pool={pool} wisdomPerHour={wisdomPerHour} />
    </Modal>
  );
}
