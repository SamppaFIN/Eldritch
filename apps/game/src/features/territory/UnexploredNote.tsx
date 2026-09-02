/**
 * A tapped hex the player has not been to (BRDC-MAP-003).
 *
 * Fog of war hides the ground until you walk it. Tapping a fogged cell used to open the
 * full `CellPanel` — terrain, yield, area, decay — which is exactly the information the
 * fog is meant to withhold. This says the one true thing instead, in the same shape as
 * the cell panel so it does not read as an error.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import './cell-panel.css';

export function UnexploredNote({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <GlassPanel
      as="section"
      ref={ref}
      className="cell-panel"
      aria-label="Unexplored cell"
      tabIndex={-1}
    >
      <div className="cell-panel__head">
        <div>
          <p className="cell-panel__ground">Not explored</p>
          <p className="cell-panel__yield">Walk here to see what it holds.</p>
        </div>
        <RitualButton
          variant="ghost"
          className="cell-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>
    </GlassPanel>
  );
}
