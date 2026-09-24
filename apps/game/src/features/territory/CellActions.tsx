/**
 * The hex's actions, all of them, in one row at the top of its card (BRDC-DETAIL-003).
 * A press acts; a section toggles open under the row. Why a press is grey is said once,
 * under the row, not beside each button.
 */
import { RitualButton } from '@es3/ui';
import type { ActionId, CellAction } from './hexActions.js';

export interface CellActionsProps {
  actions: readonly CellAction[];
  open: ActionId | null;
  onPress: (id: ActionId) => void;
  /** After-the-fact refusals (a ward or an expansion that did not go through). */
  status?: readonly string[];
}

export function CellActions({ actions, open, onPress, status = [] }: CellActionsProps) {
  if (actions.length === 0 && status.length === 0) return null;
  const why = [...actions.filter((a) => a.why).map((a) => a.why as string), ...status];
  return (
    <div className="cell-actions" role="group" aria-label="Actions on this hex">
      {actions.length > 0 ? (
        <div className="cell-actions__row">
          {actions.map((a) => (
            <RitualButton
              key={a.id}
              variant={a.opens ? 'ghost' : 'primary'}
              className={`cell-actions__btn cell-actions__btn--${a.id}`}
              disabled={a.disabled}
              aria-expanded={a.opens ? open === a.id : undefined}
              onClick={() => onPress(a.id)}
            >
              {a.label}
            </RitualButton>
          ))}
        </div>
      ) : null}
      {why.length > 0 ? (
        <p className="cell-panel__why" role="status">
          {why.join(' ')}
        </p>
      ) : null}
    </div>
  );
}
