/**
 * The quay — trading with a city state (BRDC-DIPLO-001).
 *
 * A sub-panel of `CellPanel`, the shape `ConsecratePanel` is. Diplomacy happens at one
 * hex rather than from a menu, so reaching a city state is a walk to a place: this only
 * renders on the village's own quay.
 *
 * Two taps and a button, because it is read one-handed while standing at a harbour. Give
 * is limited to what the pouch can actually part with, so the list itself is the
 * affordability check — a row you can see is a row you can press.
 */
import { useState } from 'react';
import { RESOURCE_KINDS, TRADE_LOSS, TRADE_PARCEL, tradeReturn } from '@es3/core';
import type { CityState, ResourceKind, ResourcePool, TradeRefusal } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { RESOURCE_COLOUR, RESOURCE_WORD } from './territoryFeatures.js';

const REFUSAL: Readonly<Record<TradeRefusal, string>> = {
  'same-resource': 'They will not swap a thing for itself.',
  'cannot-afford': `You need ${TRADE_PARCEL} to trade a parcel.`,
  'nothing-to-give': 'There is nothing to trade here.',
};

/** On a village hex that is not the quay: say the village's name and where its door is. */
export function VillageNote({ city, steps }: { city: CityState; steps: number }) {
  return (
    <div className="cell-panel__place">
      <p className="cell-panel__place-name">{city.name}</p>
      <p className="cell-panel__note">{city.kind}. {city.blurb}</p>
      <p className="cell-panel__why" role="status">
        {steps === 1
          ? 'Their quay is the next hex over — trade happens there.'
          : `Their quay is ${steps} hexes from here — trade happens there.`}
      </p>
    </div>
  );
}

export interface TradePostProps {
  city: CityState;
  resources: ResourcePool | null;
  refusal: TradeRefusal | null;
  onTrade: (give: ResourceKind, want: ResourceKind) => void;
}

export function TradePost({ city, resources, refusal, onTrade }: TradePostProps) {
  const [give, setGive] = useState<ResourceKind | null>(null);
  const [want, setWant] = useState<ResourceKind | null>(null);

  const canPart = RESOURCE_KINDS.filter((k) => (resources?.[k] ?? 0) >= TRADE_PARCEL);
  const chip = (k: ResourceKind, on: boolean, onPick: () => void, disabled = false) => (
    <button
      key={k}
      type="button"
      className={on ? 'trade__chip trade__chip--on' : 'trade__chip'}
      disabled={disabled}
      onClick={onPick}
    >
      <span className="trade__pip" style={{ background: RESOURCE_COLOUR[k] }} aria-hidden />
      {RESOURCE_WORD[k]}
    </button>
  );

  return (
    <div className="cell-panel__place trade">
      <p className="cell-panel__place-name">{city.name}</p>
      <p className="cell-panel__note">
        {city.kind}. {city.blurb}
      </p>
      <p className="cell-panel__note">
        They swap a parcel for a parcel, and keep {Math.round(TRADE_LOSS * 100)}% for the
        trouble: {TRADE_PARCEL} in, {tradeReturn(TRADE_PARCEL)} out.
      </p>

      <p className="trade__label">Give</p>
      {canPart.length > 0 ? (
        <div className="trade__row">{canPart.map((k) => chip(k, give === k, () => setGive(k)))}</div>
      ) : (
        <p className="cell-panel__why" role="status">
          Nothing in your pouch reaches {TRADE_PARCEL} yet.
        </p>
      )}

      <p className="trade__label">Take</p>
      <div className="trade__row">
        {RESOURCE_KINDS.map((k) => chip(k, want === k, () => setWant(k), k === give))}
      </div>

      <RitualButton
        className="cell-panel__expand"
        disabled={!give || !want || give === want}
        onClick={() => give && want && onTrade(give, want)}
      >
        {give && want && give !== want
          ? `Trade ${TRADE_PARCEL} ${RESOURCE_WORD[give]} → ${tradeReturn(TRADE_PARCEL)} ${RESOURCE_WORD[want]}`
          : 'Choose what to give and what to take'}
      </RitualButton>

      {refusal ? (
        <p className="cell-panel__refusal" role="status">
          {REFUSAL[refusal]}
        </p>
      ) : null}
    </div>
  );
}
