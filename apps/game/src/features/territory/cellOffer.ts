/**
 * What a hex offers, gathered from the card's bindings into `cellActions`' input
 * (BRDC-DETAIL-003). The gates are the ones the buttons used to carry beside them.
 */
import { MAX_TEMPLE_EXPANSION, WARD_COST, canAfford, consecrateCost, expansionCost, shortOf } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import type { CellOffer } from './hexActions.js';
import { costLine, shortNote } from './gateNote.js';
import type { QuestCellInfo } from '../quest/questCell.js';
import type { PlaceBinding } from './useSelection.js';

export interface OfferInput {
  mine: boolean;
  resources: ResourcePool | null;
  place: Pick<PlaceBinding, 'kind' | 'expansion' | 'dwellMs'>;
  canWard: boolean;
  wardGate: string | null;
  quest: QuestCellInfo | null;
  reveal: boolean;
  school: boolean;
  works: boolean;
  rites: boolean;
  trade: boolean;
  city: boolean;
  anomaly: boolean;
}

export function cellOffer(i: OfferInput): CellOffer {
  const offer: CellOffer = {};
  if (i.quest?.canAct) offer.quest = { label: i.quest.label };
  if (i.reveal) offer.reveal = { label: 'Reveal this ground' };
  if (i.mine) {
    offer.ward = { label: `Ward · ${WARD_COST.wood} timber`, disabled: !i.canWard, why: i.wardGate };
  }
  if (i.works) offer.works = 'Works';
  if (i.mine && i.place.kind === null) {
    const cost = consecrateCost(i.place.dwellMs);
    const free = Object.keys(cost).length === 0;
    const canPay = free || (i.resources !== null && canAfford(i.resources, cost));
    offer.consecrate = {
      label: free ? 'Consecrate · your time here has paid it' : `Consecrate · ${costLine(cost)}`,
      disabled: !canPay,
      why: canPay ? null : `${shortNote(shortOf(i.resources, cost)) ?? ''} Walking here longer also pays it down.`.trim(),
    };
  }
  if (i.place.kind === 'temple' && i.place.expansion < MAX_TEMPLE_EXPANSION) {
    const cost = expansionCost(i.place.expansion + 1);
    const ok = i.resources !== null && canAfford(i.resources, cost);
    offer.expand = { label: `Expand · ${costLine(cost)}`, disabled: !ok, why: ok ? null : shortNote(shortOf(i.resources, cost)) };
  }
  if (i.school) offer.school = 'Temple school';
  if (i.rites) offer.rites = 'Rites';
  if (i.trade) offer.trade = 'Trade routes';
  if (i.city) offer.city = 'Trade post';
  if (i.anomaly) offer.anomaly = 'Anomaly';
  return offer;
}
