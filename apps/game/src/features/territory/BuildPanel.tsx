/**
 * What can go on this cell — and, behind a `+`, what cannot and why (BRDC-BUILD-001, -005).
 *
 * A sub-panel of CellPanel, kept separate so neither grows past four hundred lines and so
 * "the build menu" is one testable concern. The default view lists only what can be built
 * right now; the rest is one tap away, each row naming its one blocker (BRDC-TECH-001
 * GREEN 8) — timber, a technology, or the wrong ground.
 */
import { useState } from 'react';
import {
  BUILDINGS,
  EMPTY_POOL,
  canBuild,
  hasWork,
  refund,
  worksOn,
} from '@es3/core';
import type { BuildRefusal, BuildingId, Cell, PlayerId, ResourcePool, TechId } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BUILDING_NAME as NAME, titleCase } from './names.js';
import { BUILDING_BLURB, buildingEffect, renderEffect } from './catalogue.js';

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
    case 'occupied':
      return 'Already stands here';
    case 'cell-full':
      return 'This hex is full';
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
  onDemolish: (h3: string, id: BuildingId) => void;
  /** Open a building's Guide page (BRDC-WIKI-004). Absent → the name is plain text. */
  onWiki?: ((id: BuildingId) => void) | undefined;
  refusal: { why: BuildRefusal | 'nothing-here'; id: BuildingId | null } | null;
}

/**
 * Why the build did not happen, said as what to do about it (BRDC-BUILD-008).
 *
 * This used to print the refusal slug — "That did not go through — cell full." — which is
 * every reason `canBuild` can return, flattened into a phrase that names none of them
 * usefully. Each one says what to do about it now.
 */
function refusalText(why: BuildRefusal, id: BuildingId | null): string {
  switch (why) {
    case 'cell-full':
      return 'A hex holds one Work. Demolish this one, or build on ground you have not used.';
    case 'cannot-afford':
      return id
        ? `Not enough in the pouch — ${titleCase(id)} costs ${costLine(BUILDINGS[id].cost)}.`
        : 'Not enough in the pouch.';
    case 'wrong-terrain':
      return id
        ? `${titleCase(id)} cannot stand on this ground.`
        : 'That cannot stand on this ground.';
    case 'locked': {
      const tech = id ? BUILDINGS[id].tech : null;
      return tech
        ? `Research ${titleCase(tech)} first — it is what unlocks this.`
        : 'An earlier building has to stand before this one.';
    }
    case 'needs-a-temple':
      return 'It has to be built beside a temple.';
    case 'occupied':
      return 'One of those already stands here.';
    case 'not-yours':
      return 'This ground is not yours yet. Walk it to take it.';
    default:
      return 'That cannot be built here.';
  }
}

function refusalLine(refusal: { why: BuildRefusal | 'nothing-here'; id: BuildingId | null } | null) {
  if (!refusal || refusal.why === 'nothing-here') return null;
  return (
    <p className="cell-panel__refusal" role="status">
      {refusalText(refusal.why, refusal.id)}
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
  onWiki,
  refusal,
}: BuildPanelProps) {
  const [showLocked, setShowLocked] = useState(false);
  const ctx = { playerId: me, researched, pool: resources ?? EMPTY_POOL, buildings: myBuildings };
  const all = Object.keys(BUILDINGS) as BuildingId[];
  const checks = new Map(all.map((id) => [id, canBuild(ctx, id, cell)] as const));
  const byName = (a: BuildingId, b: BuildingId) => NAME[a].localeCompare(NAME[b]);
  const here = worksOn(cell);

  const name = (id: BuildingId) =>
    onWiki ? (
      <button type="button" className="cell-panel__build-name" onClick={() => onWiki(id)}>
        {NAME[id]}
      </button>
    ) : (
      NAME[id]
    );

  const row = (id: BuildingId) => {
    const check = checks.get(id) ?? canBuild(ctx, id, cell);
    return (
      <li key={id} className="cell-panel__build-row">
        <span>
          {name(id)}
          <span className="cell-panel__build-cost"> {costLine(BUILDINGS[id].cost)}</span>
          <span className="cell-panel__build-cost">
            {' · '}
            {BUILDING_BLURB[id]}
            {buildingEffect(id) ? <> · {renderEffect(buildingEffect(id))}</> : null}
          </span>
        </span>
        {check.ok ? (
          <RitualButton className="cell-panel__build-btn" onClick={() => onBuild(cell.h3, id)}>
            {BUILDINGS[id].requires.some((r) => hasWork(cell, r)) ? 'Upgrade' : 'Build'}
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

  // What already stands here, each with its own demolish (BUILD-007). Upgrades are not
  // listed twice: `canBuild` lets `lumbermill` through onto a `sawmill`, so it appears in
  // the build list below, labelled Upgrade.
  const standing = (w: { id: BuildingId }) => {
    const back = costLine(refund(w.id));
    return (
      <li key={w.id} className="cell-panel__build-row">
        <span>
          {name(w.id)}
          <span className="cell-panel__build-cost"> · {renderEffect(buildingEffect(w.id))}</span>
        </span>
        <RitualButton
          className="cell-panel__build-btn"
          onClick={() => onDemolish(cell.h3, w.id)}
        >
          Demolish{back ? ` · +${back}` : ''}
        </RitualButton>
      </li>
    );
  };

  // Default: only what can go here now. The wall of "Wrong ground" rows is behind the `+`.
  const { ready, locked } = splitBuildable(checks);
  return (
    <div className="cell-panel__build">
      {here.length > 0 ? (
        <>
          <p className="cell-panel__build-has">Standing here</p>
          <ul className="cell-panel__build-list">{here.map(standing)}</ul>
        </>
      ) : null}

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
