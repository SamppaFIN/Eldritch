/**
 * Laying and cutting Trade Routes from the cell panel (BRDC-BUILD-004).
 *
 * A route binds two cells, so it cannot be a one-tap build. "Link a trade route" arms the
 * flow; the next tap on another held cell is the far end. A refusal says what to do.
 */
import { RitualButton } from '@es3/ui';
import type { TradeBinding } from './useSelection.js';

type RouteFail = NonNullable<TradeBinding['refusal']>;

const REFUSAL: Readonly<Record<RouteFail, string>> = {
  'same-cell': 'Pick a different cell for the other end.',
  'not-yours': 'Both ends must be ground you hold.',
  'too-far': 'The other end is too far to link.',
  'already-linked': 'These two are already linked.',
  'cannot-afford': 'Not enough stone and gold for a route.',
  'no-such-route': 'There is no route here to remove.',
};

export interface TradeControlsProps {
  trade: TradeBinding;
  cellH3: string;
}

export function TradeControls({ trade, cellH3 }: TradeControlsProps) {
  const here = trade.routes.filter((r) => r.a === cellH3 || r.b === cellH3);
  const linking = trade.linkFrom === cellH3;

  return (
    <div className="cell-panel__trade">
      <p className="cell-panel__trade-head">Trade routes</p>

      {here.map((r) => {
        const other = r.a === cellH3 ? r.b : r.a;
        return (
          <div key={other} className="cell-panel__trade-row">
            <span className="es-numeric">Linked · {other.slice(0, 7)}…</span>
            <RitualButton variant="ghost" onClick={() => trade.onRemove(r.a, r.b)}>
              Unlink
            </RitualButton>
          </div>
        );
      })}

      {linking ? (
        <div className="cell-panel__trade-row">
          <span>Tap the other end…</span>
          <RitualButton variant="ghost" onClick={trade.onCancelLink}>
            Cancel
          </RitualButton>
        </div>
      ) : (
        <RitualButton className="cell-panel__trade-btn" onClick={() => trade.onStartLink(cellH3)}>
          Link a trade route
        </RitualButton>
      )}

      {trade.refusal ? (
        <p className="cell-panel__refusal" role="status">
          {REFUSAL[trade.refusal]}
        </p>
      ) : null}
    </div>
  );
}
