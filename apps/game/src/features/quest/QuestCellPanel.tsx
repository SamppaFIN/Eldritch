/**
 * The Fuming Lake, on the hex it happens at (BRDC-QUEST-002).
 *
 * A section of `CellPanel`, the shape of `AnomalyPanel`: the site's role, a line of what
 * has happened here, and — when there is a step to take — a button that opens the
 * dialogue. Begun from the statue, advanced from the lake, the hermit, the bridge.
 */
import { RitualButton } from '@es3/ui';
import type { QuestCellInfo } from './questCell.js';

export interface QuestCellPanelProps {
  info: QuestCellInfo;
  /** Opens the graphical dialogue for this step. */
  onOpen: () => void;
}

export function QuestCellPanel({ info, onOpen }: QuestCellPanelProps) {
  return (
    <section className="cell-panel__quest" aria-label="Adventure">
      <p className="cell-panel__quest-history">{info.history}</p>
      {info.canAct ? (
        <RitualButton className="cell-panel__quest-act" onClick={onOpen}>
          {info.label}
        </RitualButton>
      ) : (
        <p className="cell-panel__quest-landmark">{info.label}</p>
      )}
    </section>
  );
}
