/**
 * The anomaly on a cell, as a sub-panel of CellPanel (BRDC-EVENT-001).
 *
 * The shape `BuildPanel` is: one concern, four states. Dormant offers the investigation;
 * investigating shows the clock; ready offers the look; a chain shows the stage and its
 * choices. The stories themselves are `BRDC-QUEST-001`; this is the frame.
 */
import { ANOMALY_INVESTIGATE_COST, canAfford } from '@es3/core';
import type { ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';
import type { AnomalyBinding } from './useAnomaly.js';

const REFUSAL: Readonly<Record<string, string>> = {
  'cannot-afford': `Not enough wisdom — an investigation costs ${ANOMALY_INVESTIGATE_COST.wisdom}. A Library beside a temple earns it.`,
  'not-ready': 'The study is not finished yet.',
  'not-yours': 'This ground is not yours.',
  'nothing-here': 'There is nothing more to find here.',
  'no-such-choice': 'That way is closed.',
};

export interface AnomalyPanelProps {
  anomaly: AnomalyBinding;
  resources: ResourcePool | null;
}

export function AnomalyPanel({ anomaly, resources }: AnomalyPanelProps) {
  const a = anomaly.current;
  if (!a) return null;
  const affordable = resources ? canAfford(resources, ANOMALY_INVESTIGATE_COST) : false;

  return (
    <section className="cell-panel__anomaly" aria-label="Anomaly">
      {a.state === 'dormant' ? (
        <>
          <p className="cell-panel__anomaly-text">Something is wrong with this ground.</p>
          <RitualButton
            variant="ghost"
            onClick={anomaly.onInvestigate}
            disabled={!affordable}
          >
            Investigate · {ANOMALY_INVESTIGATE_COST.wisdom} wisdom
          </RitualButton>
        </>
      ) : null}

      {a.state === 'investigating' ? (
        <>
          <p className="cell-panel__anomaly-text">Studying it… {Math.round(a.progress * 100)}%</p>
          <div className="cell-panel__bar" aria-hidden>
            <div className="cell-panel__bar-fill" style={{ inlineSize: `${a.progress * 100}%` }} />
          </div>
        </>
      ) : null}

      {a.state === 'ready' ? (
        <>
          <p className="cell-panel__anomaly-text">The study is done. Something waits.</p>
          <RitualButton variant="ghost" onClick={anomaly.onResolve}>
            Look
          </RitualButton>
        </>
      ) : null}

      {a.state === 'chain' && a.stage ? (
        <>
          <p className="cell-panel__anomaly-text cell-panel__anomaly-text--story">{a.stage.text}</p>
          <div className="cell-panel__anomaly-choices">
            {a.stage.choices.map((c, i) => (
              <RitualButton key={i} variant="ghost" onClick={() => anomaly.onChoose(i)}>
                {c.text}
              </RitualButton>
            ))}
          </div>
        </>
      ) : null}

      {anomaly.refusal ? (
        <p className="cell-panel__anomaly-refusal" role="status">
          {REFUSAL[anomaly.refusal] ?? 'That did not work.'}
        </p>
      ) : null}
    </section>
  );
}
