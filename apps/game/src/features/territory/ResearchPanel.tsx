/**
 * The research screen (BRDC-TECH-001).
 *
 * A section of the Hearth panel, since research is about the whole domain, not one cell.
 * It lists the frontier — every rite whose prerequisites are met — with its wisdom price,
 * and marks the moment an era turns, which is the one ceremony the tree has.
 */
import { MetatronsCube, RitualButton } from '@es3/ui';
import { TECHS, researchCost } from '@es3/core';
import type { TechRefusal } from '@es3/core';
import { titleCase } from './BuildPanel.js';
import type { ResearchBinding } from './useSelection.js';

const TOTAL = Object.keys(TECHS).length;

const REFUSAL: Readonly<Record<TechRefusal, string>> = {
  'already-known': 'That rite is already known.',
  locked: 'An earlier rite must come first.',
  'cannot-afford': 'Not enough wisdom. A Library or the Insight rite gathers it.',
};

export interface ResearchPanelProps {
  research: ResearchBinding;
  wisdom: number;
}

export function ResearchPanel({ research, wisdom }: ResearchPanelProps) {
  return (
    <div className="hearth-panel__research">
      <p className="hearth-panel__research-head">
        Rites · {titleCase(research.era)} · {research.researched.length}/{TOTAL} known
      </p>

      {research.lastEra ? (
        <p className="hearth-panel__research-era" role="status">
          <MetatronsCube size={28} animate={1400} aria-hidden />
          You have entered {titleCase(research.lastEra)}.
        </p>
      ) : null}

      {research.options.length === 0 ? (
        <p className="hearth-panel__line">Every rite is known.</p>
      ) : (
        research.options.map((id) => {
          const cost = researchCost(id);
          return (
            <div key={id} className="hearth-panel__research-row">
              <span>{titleCase(id)}</span>
              <RitualButton
                variant="ghost"
                disabled={wisdom < cost}
                onClick={() => research.onResearch(id)}
              >
                {cost} wisdom
              </RitualButton>
            </div>
          );
        })
      )}

      {research.refusal ? (
        <p className="hearth-panel__line hearth-panel__line--warn" role="status">
          {REFUSAL[research.refusal]}
        </p>
      ) : null}
    </div>
  );
}
