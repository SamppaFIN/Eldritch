/**
 * Consecrate an owned cell as a temple (BRDC-TEMPLE-001).
 *
 * A temple has only ever come from ninety minutes standing in one cell. This buys the
 * rest of that time with stone and gold, and whatever dwell the cell has already banked
 * comes straight off the price — the walk and the wallet meet in the middle. A cell at
 * the full threshold is free, which is exactly the reveal that already happens.
 *
 * A sub-panel of CellPanel, the shape `BuildPanel` is, so neither file grows past the
 * limit. The button is only shown when consecration would succeed, so there is no
 * refusal line — the disabled state carries "cannot afford".
 */
import { TEMPLE_THRESHOLD_MS, canAfford, consecrateCost } from '@es3/core';
import type { Cell, ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';

const NAME: Readonly<Record<string, string>> = {
  wood: 'timber',
  stone: 'stone',
  iron: 'iron',
  food: 'food',
  gold: 'gold',
};

/** "120 stone · 80 gold" from a cost map. */
const costLine = (cost: Partial<ResourcePool>): string =>
  (Object.entries(cost) as [string, number][]).map(([k, v]) => `${v} ${NAME[k] ?? k}`).join(' · ');

export interface ConsecratePanelProps {
  cell: Cell;
  resources: ResourcePool | null;
  /** Time already spent in this cell — it pays the cost down (BRDC-DWELL-001). */
  dwellMs: number;
  onConsecrate: (h3: string) => void;
}

export function ConsecratePanel({
  cell,
  resources,
  dwellMs,
  onConsecrate,
}: ConsecratePanelProps) {
  const cost = consecrateCost(dwellMs);
  const free = Object.keys(cost).length === 0;
  const paidPct = Math.min(100, Math.round((dwellMs / TEMPLE_THRESHOLD_MS) * 100));
  const canPay = free || (resources !== null && canAfford(resources, cost));

  return (
    <div className="cell-panel__place">
      <p className="cell-panel__place-name">Consecrate a temple</p>
      <p className="cell-panel__note">
        A temple draws mana every hour, for as long as you keep walking to it.
        {dwellMs > 0 && !free ? ` Your time here has paid ${paidPct}% of the cost.` : ''}
      </p>
      <RitualButton
        className="cell-panel__expand"
        disabled={!canPay}
        onClick={() => onConsecrate(cell.h3)}
      >
        {free ? 'Consecrate · your time here has paid it' : `Consecrate · ${costLine(cost)}`}
      </RitualButton>
    </div>
  );
}
