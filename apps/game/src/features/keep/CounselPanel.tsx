/**
 * The Keeper's Counsel as its own sheet, opened from the nav bar (Infinite 2026-09-30:
 * *"siirrä my lands ja council tuohon osioon"*). Same sheet as the Hall of Fame and Your
 * lands; the advice itself is `KeepCounsel`.
 */
import { GlassPanel, RitualButton } from '@es3/ui';
import type { GameRepository } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { KeepCounsel } from './KeepCounsel.js';
import '../hall/hall-of-fame.css';

export interface CounselPanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  onClose: () => void;
}

export function CounselPanel({ open, repository, now, onClose }: CounselPanelProps) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <GlassPanel as="section" className="hall" aria-label="The Keeper’s Counsel" tabIndex={-1}>
      <div className="hall__bar">
        <h2 className="hall__title">The Keeper’s Counsel</h2>
        <RitualButton variant="ghost" className="hall__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>
      <KeepCounsel repository={repository} now={now()} />
    </GlassPanel>
  );
}
