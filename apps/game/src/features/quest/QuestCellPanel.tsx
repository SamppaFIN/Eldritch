/**
 * The Fuming Lake, on the hex it happens at (BRDC-QUEST-002).
 *
 * A section of `CellPanel`, the shape of `AnomalyPanel`: the site's role, a line of what
 * has happened here, and — when there is a step to take — a button that opens the
 * dialogue. Begun from the statue, advanced from the lake, the hermit, the bridge.
 */
import type { QuestCellInfo } from './questCell.js';

export interface QuestCellPanelProps {
  info: QuestCellInfo;
}

/** The site's story line. Its step button lives in the card's action row (BRDC-DETAIL-003). */
export function QuestCellPanel({ info }: QuestCellPanelProps) {
  return (
    <section className="cell-panel__quest" aria-label="Adventure">
      <p className="cell-panel__quest-history">{info.history}</p>
      {info.canAct ? null : <p className="cell-panel__quest-landmark">{info.label}</p>}
    </section>
  );
}
