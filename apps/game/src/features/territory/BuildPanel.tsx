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
  sawmill: 'Sawmill',
  lumbermill: 'Lumbermill',
  mine: 'Mine',
  quarry: 'Quarry',
  farm: 'Farm',
  fishery: 'Fishery',
  vineyard: 'Vineyard',
  library: 'Library',
  'temple-grove': 'Temple Grove',
  lighthouse: 'Lighthouse',
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
    case 'needs-a-temple':
      return 'Build it beside a temple';
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

function refusalLine(refusal: BuildRefusal | 'nothing-here' | null) {
  if (!refusal || refusal === 'nothing-here') return null;
  return (
    <p className="cell-panel__refusal" role="status">
      That did not go through — {refusal.replace(/-/g, ' ')}.
    </p>
  );
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
  const ctx = { playerId: me, researched, pool: resources ?? EMPTY_POOL, buildings: myBuildings };
  const all = Object.keys(BUILDINGS) as BuildingId[];
  const checks = new Map(all.map((id) => [id, canBuild(ctx, id, cell)] as const));

  const row = (id: BuildingId) => {
    const check = checks.get(id) ?? canBuild(ctx, id, cell);
    return (
      <li key={id} className="cell-panel__build-row">
        <span>
          {NAME[id]}
          <span className="cell-panel__build-cost"> {costLine(BUILDINGS[id].cost)}</span>
        </span>
        {check.ok ? (
          <RitualButton className="cell-panel__build-btn" onClick={() => onBuild(cell.h3, id)}>
            {cell.building ? 'Upgrade' : 'Build'}
          </RitualButton>
        ) : (
          <span className="cell-panel__build-why">{reason(check.refused, id)}</span>
        )}
      </li>
    );
  };

  if (cell.building) {
    const held = cell.building.id;
    const upgrades = all.filter((id) => BUILDINGS[id].requires.includes(held));
    const back = costLine(refund(held));
    return (
      <div className="cell-panel__build">
        <p className="cell-panel__build-has">{NAME[held]} stands here.</p>
        {upgrades.length > 0 ? (
          <ul className="cell-panel__build-list">{upgrades.map(row)}</ul>
        ) : null}
        <RitualButton className="cell-panel__build-btn" onClick={() => onDemolish(cell.h3)}>
          Demolish{back ? ` · +${back}` : ''}
        </RitualButton>
        {refusalLine(refusal)}
      </div>
    );
  }

  // Buildable first, then by name — eleven rows, most reading "Wrong ground" on any cell.
  const ids = [...all].sort(
    (a, b) =>
      Number(!checks.get(a)?.ok) - Number(!checks.get(b)?.ok) || NAME[a].localeCompare(NAME[b]),
  );

  return (
    <div className="cell-panel__build">
      <p className="cell-panel__build-head">Build</p>
      <ul className="cell-panel__build-list">{ids.map(row)}</ul>
      {refusalLine(refusal)}
    </div>
  );
}
