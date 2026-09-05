/**
 * What can go on this cell — and, behind a `+`, what cannot and why (BRDC-BUILD-001, -005).
 *
 * A sub-panel of CellPanel, kept separate so neither grows past four hundred lines and so
 * "the build menu" is one testable concern. The default view lists only what can be built
 * right now; the rest is one tap away, each row naming its one blocker (BRDC-TECH-001
 * GREEN 8) — timber, a technology, or the wrong ground.
 */
import { useState } from 'react';
import { BUILDINGS, EMPTY_POOL, canBuild, refund } from '@es3/core';
import type { BuildRefusal, BuildingId, Cell, PlayerId, ResourcePool, TechId } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BUILDING_NAME as NAME, titleCase } from './names.js';

export { titleCase };

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

/**
 * Split a set of build checks into what can go here now and what is still blocked
 * (BRDC-BUILD-005). Order within each list is the caller's; this only partitions.
 */
export function splitBuildable(
  checks: ReadonlyMap<BuildingId, { ok: boolean }>,
): { ready: BuildingId[]; locked: BuildingId[] } {
  const ready: BuildingId[] = [];
  const locked: BuildingId[] = [];
  for (const [id, c] of checks) (c.ok ? ready : locked).push(id);
  return { ready, locked };
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
  const [showLocked, setShowLocked] = useState(false);
  const ctx = { playerId: me, researched, pool: resources ?? EMPTY_POOL, buildings: myBuildings };
  const all = Object.keys(BUILDINGS) as BuildingId[];
  const checks = new Map(all.map((id) => [id, canBuild(ctx, id, cell)] as const));
  const byName = (a: BuildingId, b: BuildingId) => NAME[a].localeCompare(NAME[b]);

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

  const moreToggle = (locked: BuildingId[]) =>
    locked.length > 0 ? (
      <button
        type="button"
        className="cell-panel__build-more"
        aria-expanded={showLocked}
        onClick={() => setShowLocked((v) => !v)}
      >
        {showLocked ? 'Show less' : `+ ${locked.length} more`}
      </button>
    ) : null;

  if (cell.building) {
    const held = cell.building.id;
    const upgrades = all.filter((id) => BUILDINGS[id].requires.includes(held));
    const back = costLine(refund(held));
    return (
      <div className="cell-panel__build">
        <p className="cell-panel__build-has">{NAME[held]} stands here.</p>
        {upgrades.length > 0 ? (
          <ul className="cell-panel__build-list">{[...upgrades].sort(byName).map(row)}</ul>
        ) : null}
        <RitualButton className="cell-panel__build-btn" onClick={() => onDemolish(cell.h3)}>
          Demolish{back ? ` · +${back}` : ''}
        </RitualButton>
        {refusalLine(refusal)}
      </div>
    );
  }

  // Default: only what can go here now. The wall of "Wrong ground" rows is behind the `+`.
  const { ready, locked } = splitBuildable(checks);
  return (
    <div className="cell-panel__build">
      <p className="cell-panel__build-head">Build</p>
      {ready.length > 0 ? (
        <ul className="cell-panel__build-list">{[...ready].sort(byName).map(row)}</ul>
      ) : (
        <p className="cell-panel__build-none">Nothing can be built here yet.</p>
      )}
      {moreToggle(locked)}
      {showLocked ? (
        <ul className="cell-panel__build-list">{[...locked].sort(byName).map(row)}</ul>
      ) : null}
      {refusalLine(refusal)}
    </div>
  );
}
