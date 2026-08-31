/**
 * What can go on this cell — and, for what cannot, why not (BRDC-BUILD-001).
 *
 * A sub-panel of CellPanel, kept separate so neither grows past four hundred lines and so
 * "the build menu" is one testable concern. Every locked building names what would open
 * it (BRDC-TECH-001 GREEN 8), not just "locked".
 */
import { BUILDINGS, EMPTY_POOL, canBuild, refund } from '@es3/core';
import type { BuildRefusal, BuildingId, Cell, PlayerId, ResourcePool, TechId } from '@es3/core';
import { RitualButton } from '@es3/ui';

const NAME: Readonly<Record<BuildingId, string>> = {
  granary: 'Granary',
  monument: 'Monument',
  storehouse: 'Storehouse',
  market: 'Market',
};

/** `early-farming` → `Early Farming`. The tech table carries no display name of its own. */
export const titleCase = (slug: string): string =>
  slug.replace(/(^|-)([a-z])/g, (_, sep: string, ch: string) => (sep ? ' ' : '') + ch.toUpperCase());

const costLine = (cost: Readonly<Partial<ResourcePool>>): string =>
  Object.entries(cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');

/** Why a building is refused, in a phrase — the locked case names its technology (TECH-001 GREEN 8). */
export function reason(refused: BuildRefusal, id: BuildingId): string {
  switch (refused) {
    case 'wrong-terrain':
      return 'Wrong ground';
    case 'locked': {
      const tech = BUILDINGS[id].tech;
      return tech ? `Needs ${titleCase(tech)}` : 'Needs an earlier building';
    }
    case 'at-capacity':
      return 'No room — build a Granary';
    case 'cannot-afford':
      return 'Cannot afford';
    default:
      return 'Cannot build here';
  }
}

export interface BuildPanelProps {
  cell: Cell;
  me: PlayerId;
  researched: readonly TechId[];
  resources: ResourcePool | null;
  myBuildings: readonly BuildingId[];
  onBuild: (h3: string, id: BuildingId) => void;
  onDemolish: (h3: string) => void;
  refusal: BuildRefusal | 'nothing-here' | null;
}

export function BuildPanel({
  cell,
  me,
  researched,
  resources,
  myBuildings,
  onBuild,
  onDemolish,
  refusal,
}: BuildPanelProps) {
  if (cell.building) {
    const back = costLine(refund(cell.building.id));
    return (
      <div className="cell-panel__build">
        <p className="cell-panel__build-has">{NAME[cell.building.id]} stands here.</p>
        <RitualButton className="cell-panel__build-btn" onClick={() => onDemolish(cell.h3)}>
          Demolish{back ? ` · +${back}` : ''}
        </RitualButton>
      </div>
    );
  }

  const pool = resources ?? EMPTY_POOL;
  const ids = Object.keys(BUILDINGS) as BuildingId[];

  return (
    <div className="cell-panel__build">
      <p className="cell-panel__build-head">Build</p>
      <ul className="cell-panel__build-list">
        {ids.map((id) => {
          const check = canBuild({ playerId: me, researched, pool, buildings: myBuildings }, id, cell);
          return (
            <li key={id} className="cell-panel__build-row">
              <span>
                {NAME[id]}
                <span className="cell-panel__build-cost"> {costLine(BUILDINGS[id].cost)}</span>
              </span>
              {check.ok ? (
                <RitualButton className="cell-panel__build-btn" onClick={() => onBuild(cell.h3, id)}>
                  Build
                </RitualButton>
              ) : (
                <span className="cell-panel__build-why">{reason(check.refused, id)}</span>
              )}
            </li>
          );
        })}
      </ul>
      {refusal && refusal !== 'nothing-here' ? (
        <p className="cell-panel__refusal" role="status">
          That did not go through — {refusal.replace(/-/g, ' ')}.
        </p>
      ) : null}
    </div>
  );
}
