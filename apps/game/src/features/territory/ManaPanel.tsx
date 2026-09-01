/**
 * The Keep's Mana tab (BRDC-KEEP-002).
 *
 * Two things you do with the Keep: light the Altar for more mana an hour, and channel that
 * mana into wisdom when you have no Library. The Altar is the Anchor invested in — level 0
 * is the bare stone, 1–3 is lit. A section of the Hearth panel, `ResearchPanel`'s shape.
 */
import { BASE_STORAGE_CAP, MANA_CHANNEL_STEP, MANA_TO_WISDOM_RATE, expansionCost } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';
import type { KeepEconomy } from './useKeepEconomy.js';

const REFUSAL: Readonly<Record<string, string>> = {
  'not-the-altar': 'The Altar is your Anchor Stone — found the Hearth first.',
  'at-max': 'The Altar is already at its height.',
  'cannot-afford': 'Not enough stone and gold for the next step.',
  'wisdom-full': 'Your wisdom is full — spend some on a Rite first.',
};

const CHANNEL_GAIN = MANA_CHANNEL_STEP / MANA_TO_WISDOM_RATE;

export interface ManaPanelProps {
  keep: KeepEconomy;
  pool: ResourcePool | null;
}

export function ManaPanel({ keep, pool }: ManaPanelProps) {
  const mana = pool?.mana ?? 0;
  const wisdom = pool?.wisdom ?? 0;
  const cost = expansionCost(keep.altarLevel + 1);
  const canRaise =
    !keep.atMax && (pool ? (pool.stone >= (cost.stone ?? 0) && pool.gold >= (cost.gold ?? 0)) : false);
  const canChannel = mana >= MANA_CHANNEL_STEP && wisdom + CHANNEL_GAIN <= BASE_STORAGE_CAP;

  return (
    <div className="hearth-panel__tabbody">
      <p className="hearth-panel__line">
        {keep.altarLevel === 0
          ? 'The Altar sleeps — your Anchor Stone, unlit.'
          : `The Altar burns at level ${keep.altarLevel}.`}{' '}
        <span className="es-numeric">{keep.altarManaPerHour} mana/h</span>
      </p>

      <div className="hearth-panel__research-row">
        <span>{keep.atMax ? 'At its height' : keep.altarLevel === 0 ? 'Light the Altar' : 'Raise the Altar'}</span>
        <RitualButton variant="ghost" disabled={!canRaise} onClick={keep.onRaiseAltar}>
          {keep.atMax ? '—' : `${cost.stone} stone · ${cost.gold} gold`}
        </RitualButton>
      </div>

      <div className="hearth-panel__research-row">
        <span>
          Channel mana to wisdom
          <span className="hearth-panel__research-wait"> · {MANA_CHANNEL_STEP} mana → {CHANNEL_GAIN} wisdom</span>
        </span>
        <RitualButton variant="ghost" disabled={!canChannel} onClick={keep.onChannel}>
          Channel
        </RitualButton>
      </div>

      {keep.refusal ? (
        <p className="hearth-panel__line hearth-panel__line--warn" role="status">
          {REFUSAL[keep.refusal] ?? 'That did not work.'}
        </p>
      ) : null}
    </div>
  );
}
