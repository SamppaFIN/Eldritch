/**
 * The Keep's Mana tab (BRDC-KEEP-002).
 *
 * One thing you do here: light the Altar, and raise it. The Altar is the Anchor invested
 * in — level 0 is the bare stone, 1–3 is lit — and every place you hold pays its rate
 * twice, once in mana and once in wisdom (PIVOT-2026-09-09 P3). Channelling one into the
 * other used to live here; there is nothing left to trade. A section of the Hearth panel,
 * `ResearchPanel`'s shape.
 */
import { expansionCost, shortOf } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { shortNote } from './gateNote.js';
import type { KeepEconomy } from './useKeepEconomy.js';

const REFUSAL: Readonly<Record<string, string>> = {
  'not-the-altar': 'The Altar is your Anchor Stone — found the Hearth first.',
  'at-max': 'The Altar is already at its height.',
  'cannot-afford': 'Not enough stone and gold for the next step.',
};

export interface ManaPanelProps {
  keep: KeepEconomy;
  pool: ResourcePool | null;
}

export function ManaPanel({ keep, pool }: ManaPanelProps) {
  const cost = expansionCost(keep.altarLevel + 1);
  const canRaise =
    !keep.atMax && (pool ? (pool.stone >= (cost.stone ?? 0) && pool.gold >= (cost.gold ?? 0)) : false);
  // "At its height" already explains the maxed case; this covers the other one.
  const raiseGate = canRaise || keep.atMax ? null : shortNote(shortOf(pool, cost));

  return (
    <div className="hearth-panel__tabbody">
      <p className="hearth-panel__line">
        {keep.altarLevel === 0
          ? 'The Altar sleeps — your Anchor Stone, unlit.'
          : `The Altar burns at level ${keep.altarLevel}.`}{' '}
        <span className="es-numeric">
          {keep.altarManaPerHour} mana/h · {keep.altarManaPerHour} wisdom/h
        </span>
      </p>

      <p className="hearth-panel__line">
        Every place you hold pays both — mana for the Rites you cast, wisdom for the
        Research you spend it on.
      </p>

      <div className="hearth-panel__research-row">
        <span>{keep.altarLevel === 0 ? 'Light the Altar' : 'Raise the Altar'}</span>
        <RitualButton variant="ghost" disabled={!canRaise} onClick={keep.onRaiseAltar}>
          {keep.atMax ? 'At its height' : `${cost.stone} stone · ${cost.gold} gold`}
        </RitualButton>
      </div>

      {raiseGate ? (
        <p className="hearth-panel__line hearth-panel__line--warn" role="status">
          {raiseGate}
        </p>
      ) : null}

      {keep.refusal ? (
        <p className="hearth-panel__line hearth-panel__line--warn" role="status">
          {REFUSAL[keep.refusal] ?? 'That did not work.'}
        </p>
      ) : null}
    </div>
  );
}
