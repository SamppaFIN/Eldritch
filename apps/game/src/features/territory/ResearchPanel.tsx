/**
 * The research screen (BRDC-TECH-001, BRDC-STATS-001).
 *
 * A section of the Hearth panel, since research is about the whole domain, not one cell.
 * It lists the frontier — every rite whose prerequisites are met — with its wisdom price
 * and, from the forecast, how long until that price is met. It marks the moment an era
 * turns, which is the one ceremony the tree has.
 */
import { MetatronsCube, RitualButton } from '@es3/ui';
import { TECHS, researchCost, timeToAfford } from '@es3/core';
import type { ResourcePool, TechRefusal } from '@es3/core';
import { titleCase } from './BuildPanel.js';
import type { ResearchBinding } from './useSelection.js';

const TOTAL = Object.keys(TECHS).length;
const HOUR = 3_600_000;

/** " · ~3 h" until a rite is affordable, "" when it already is, a note when it never is. */
export function waitFor(cost: number, pool: ResourcePool | null, wisdomPerHour: number): string {
  if (!pool) return '';
  const ms = timeToAfford(pool, { wisdom: wisdomPerHour }, { wisdom: cost });
  if (ms === null) return ' · no wisdom coming in';
  return ms === 0 ? '' : ` · ~${Math.round(ms / HOUR)} h`;
}

/** Errors say what to do, not what failed (AI-Koulu ch.3). */
const REFUSAL: Readonly<Record<TechRefusal, string>> = {
  'already-known': 'That technology is already known.',
  locked: 'An earlier technology must come first.',
  'cannot-afford': 'Not enough wisdom. A Library or the Insight rite gathers it.',
};

export interface ResearchPanelProps {
  research: ResearchBinding;
  /** The pouch, for the affordability check and the wait hint. */
  pool: ResourcePool | null;
  /** Forecast wisdom per hour (BRDC-STATS-001). */
  wisdomPerHour: number;
}

export function ResearchPanel({ research, pool, wisdomPerHour }: ResearchPanelProps) {
  const wisdom = pool?.wisdom ?? 0;

  return (
    <div className="hearth-panel__research">
      <p className="hearth-panel__research-head">
        Research · {titleCase(research.era)} · {research.researched.length}/{TOTAL} known
      </p>

      {research.lastEra ? (
        <p className="hearth-panel__research-era" role="status">
          <MetatronsCube size={28} animate={1400} aria-hidden />
          You have entered {titleCase(research.lastEra)}.
        </p>
      ) : null}

      {research.options.length === 0 ? (
        <p className="hearth-panel__line">Every technology is known.</p>
      ) : (
        research.options.map((id) => {
          const cost = researchCost(id);
          const pending = research.researching === id;
          return (
            <div key={id} className="hearth-panel__research-row">
              <span>
                {titleCase(id)}
                <span className="hearth-panel__research-wait">
                  {waitFor(cost, pool, wisdomPerHour)}
                </span>
              </span>
              <RitualButton
                variant="ghost"
                disabled={wisdom < cost || pending}
                onClick={() => research.onResearch(id)}
              >
                {/* A tap can take a visible second — getOwnedCells's full scan
                    (BRDC-SCALE-001) — and silence that long reads as broken. */}
                {pending ? 'Researching…' : `${cost} wisdom`}
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
