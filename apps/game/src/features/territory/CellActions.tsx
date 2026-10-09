/**
 * The hex's actions in one row at the top of its card (BRDC-DETAIL-003). A press acts; a
 * section toggles open under the row.
 *
 * The first three things this hex can do now are shown; the rest wait behind "More"
 * (BRDC-UX-005) — the Hearth offered nine at once. Why a press is grey is said under that
 * press, not in a line between the buttons that names no one.
 */
import { useState } from 'react';
import { RitualButton } from '@es3/ui';
import type { ActionId, CellAction } from './hexActions.js';

/** Shown before "More". */
const UP_FRONT = 3;

export interface CellActionsProps {
  actions: readonly CellAction[];
  open: ActionId | null;
  onPress: (id: ActionId) => void;
  /** After-the-fact refusals (a ward or an expansion that did not go through), by the press. */
  status?: Partial<Record<ActionId, string>>;
}

export function CellActions({ actions, open, onPress, status = {} }: CellActionsProps) {
  const [more, setMore] = useState(false);
  if (actions.length === 0 && Object.keys(status).length === 0) return null;
  // Up front: the first three that can be pressed, and whatever is open or just refused.
  const front = new Set(actions.filter((a) => !a.disabled).slice(0, UP_FRONT).map((a) => a.id));
  for (const a of actions) if (a.id === open || status[a.id]) front.add(a.id);
  const hidden = actions.filter((a) => !front.has(a.id)).length;
  const shown = more ? actions : actions.filter((a) => front.has(a.id));
  // A refusal for a press this hex no longer offers still has to be said somewhere.
  const stray = Object.entries(status)
    .filter(([id]) => !actions.some((a) => a.id === id))
    .map(([, why]) => why);

  return (
    <div className="cell-actions" role="group" aria-label="Actions on this hex">
      {actions.length > 0 ? (
        <div className="cell-actions__row">
          {shown.map((a) => {
            const why = status[a.id] ?? a.why;
            return (
              <div key={a.id} className="cell-actions__item">
                <RitualButton
                  variant={a.opens ? 'ghost' : 'primary'}
                  className={`cell-actions__btn cell-actions__btn--${a.id}`}
                  disabled={a.disabled}
                  aria-expanded={a.opens ? open === a.id : undefined}
                  onClick={() => onPress(a.id)}
                >
                  {a.label}
                </RitualButton>
                {why ? (
                  <p className="cell-panel__why" role="status">
                    {why}
                  </p>
                ) : null}
              </div>
            );
          })}
          {hidden > 0 ? (
            <RitualButton variant="ghost" className="cell-actions__btn" aria-expanded={more} onClick={() => setMore((m) => !m)}>
              {more ? 'Less' : `More · ${hidden}`}
            </RitualButton>
          ) : null}
        </div>
      ) : null}
      {stray.length > 0 ? (
        <p className="cell-panel__why" role="status">
          {stray.join(' ')}
        </p>
      ) : null}
    </div>
  );
}
