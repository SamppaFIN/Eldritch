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
  LORE,
  TECHS,
  buildCost,
  canBuild,
  hasWork,
  loreAllows,
  loreFor,
  refund,
  worksOn,
} from '@es3/core';
import type { BuildCheck, BuildRefusal, BuildingId, Cell, LoreId, PlayerId, ResourcePool, TechId } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BUILDING_NAME as NAME, titleCase } from './names.js';
import { costLine } from './gateNote.js';
import { BUILDING_BLURB, buildingEffect, renderEffect } from './catalogue.js';
import './build-panel.css';

const ALL_TECHS = Object.keys(TECHS) as TechId[];


/** The Lore tech a Season 2 building waits for, by name — or null. */
const loreGate = (id: BuildingId, lore: readonly LoreId[] | null | undefined): string | null => {
  const gate = lore ? loreFor(id) : null;
  return gate && !lore?.includes(gate) ? LORE[gate].name : null;
};

/** Why a building is refused, in a phrase — the locked case names its technology (TECH-001 GREEN 8). */
export function reason(refused: BuildRefusal, id: BuildingId, lore?: readonly LoreId[] | null): string {
  switch (refused) {
    case 'wrong-terrain':
      return 'Wrong ground';
    case 'locked': {
      // Season 2: the Lore decides, not the old Research tree (field report 2026-09-30).
      const study = loreGate(id, lore);
      if (study) return `Needs ${study} (Lore)`;
      const tech = lore ? null : BUILDINGS[id].tech;
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
 * Split a set of build checks three ways (BRDC-BUILD-010).
 *
 * `ready` can go up now. `here` is blocked but belongs on this ground — a Mine on a
 * mountain you have not researched Mining for. `elsewhere` is refused because the ground
 * is wrong, and is the only part worth hiding.
 *
 * It used to be two lists, and everything blocked went behind a `+ N more` toggle. So a
 * player standing on a mountain saw "Nothing can be built here yet", with the Mine filed
 * alphabetically among fourteen things that could never go there — and concluded the game
 * had no mines in it. Ground should say what it is for, even when you cannot use it yet.
 */
export function splitBuildable(
  checks: ReadonlyMap<BuildingId, { ok: boolean; refused?: BuildRefusal }>,
): { ready: BuildingId[]; here: BuildingId[]; elsewhere: BuildingId[] } {
  const ready: BuildingId[] = [];
  const here: BuildingId[] = [];
  const elsewhere: BuildingId[] = [];
  for (const [id, c] of checks) {
    if (c.ok) ready.push(id);
    else if (c.refused === 'wrong-terrain' || c.refused === 'needs-a-temple') elsewhere.push(id);
    else here.push(id);
  }
  return { ready, here, elsewhere };
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
  /** Whether a temple / iron stands beside this hex, as the store will ask when it builds. */
  near?: { templeAdjacent: boolean; ironAdjacent: boolean };
  /** A Season 2 realm's learned Lore — it, not the old tree, gates the list. Null on Season 1. */
  lore?: readonly LoreId[] | null;
}

/**
 * Why the build did not happen, said as what to do about it (BRDC-BUILD-008).
 *
 * This used to print the refusal slug — "That did not go through — cell full." — which is
 * every reason `canBuild` can return, flattened into a phrase that names none of them
 * usefully. Each one says what to do about it now.
 */
function refusalText(why: BuildRefusal, id: BuildingId | null, lore?: readonly LoreId[] | null): string {
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
      const study = id ? loreGate(id, lore) : null;
      if (study) return `Study ${study} in the Lore first — it is what unlocks this.`;
      const tech = id && !lore ? BUILDINGS[id].tech : null;
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

function refusalLine(
  refusal: { why: BuildRefusal | 'nothing-here'; id: BuildingId | null } | null,
  lore?: readonly LoreId[] | null,
) {
  if (!refusal || refusal.why === 'nothing-here') return null;
  return (
    <p className="cell-panel__refusal" role="status">
      {refusalText(refusal.why, refusal.id, lore)}
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
  lore = null,
  near,
}: BuildPanelProps) {
  const [showLocked, setShowLocked] = useState(false);
  const ctx = { playerId: me, researched, pool: resources ?? EMPTY_POOL, buildings: myBuildings, ...near };
  // Masterworks are raised in the Keep, never built from this list; on a Season 2 save the
  // Fortress is one of them too.
  const all = (Object.keys(BUILDINGS) as BuildingId[]).filter((id) => !BUILDINGS[id].masterwork && !(lore && id === 'fortress'));
  const copies = (id: BuildingId) => myBuildings.filter((b) => b === id).length;
  /** Season 2 asks what the build store asks: every old tech passed, the Lore gates, copies cost more. */
  const check = (id: BuildingId): BuildCheck => {
    if (!lore) return canBuild(ctx, id, cell);
    const c = canBuild({ ...ctx, researched: ALL_TECHS, copies: copies(id) }, id, cell);
    return c.ok && !loreAllows(id, lore) ? { ok: false, refused: 'locked' } : c;
  };
  const price = (id: BuildingId) => (lore ? buildCost(id, copies(id)) : BUILDINGS[id].cost);
  const checks = new Map(all.map((id) => [id, check(id)] as const));
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
    const verdict = checks.get(id) ?? check(id);
    return (
      <li key={id} className="cell-panel__build-row">
        <span>
          {name(id)}
          <span className="cell-panel__build-cost"> {costLine(price(id))}</span>
          <span className="cell-panel__build-cost">
            {' · '}
            {BUILDING_BLURB[id]}
            {buildingEffect(id) ? <> · {renderEffect(buildingEffect(id))}</> : null}
          </span>
        </span>
        {verdict.ok ? (
          <RitualButton className="cell-panel__build-btn" onClick={() => onBuild(cell.h3, id)}>
            {BUILDINGS[id].requires.some((r) => hasWork(cell, r)) ? 'Upgrade' : 'Build'}
          </RitualButton>
        ) : (
          <span className="cell-panel__build-why">{reason(verdict.refused, id, lore)}</span>
        )}
      </li>
    );
  };

  const moreToggle = (elsewhere: BuildingId[]) =>
    elsewhere.length > 0 ? (
      <button
        type="button"
        className="cell-panel__build-more"
        aria-expanded={showLocked}
        onClick={() => setShowLocked((v) => !v)}
      >
        {showLocked ? 'Show less' : `+ ${elsewhere.length} for other ground`}
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

  // What can go here now, then what this ground is for but you cannot raise yet. Only the
  // wall of "Wrong ground" rows is behind the `+`.
  const { ready, here: soon, elsewhere } = splitBuildable(checks);
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
      ) : null}

      {soon.length > 0 ? (
        <>
          <p className="cell-panel__build-soon">
            {ready.length > 0 ? 'This ground also holds' : 'This ground holds'}
          </p>
          <ul className="cell-panel__build-list">{[...soon].sort(byName).map(row)}</ul>
        </>
      ) : null}

      {ready.length === 0 && soon.length === 0 ? (
        <p className="cell-panel__build-none">Nothing can be built on this ground.</p>
      ) : null}

      {moreToggle(elsewhere)}
      {showLocked ? (
        <ul className="cell-panel__build-list">{[...elsewhere].sort(byName).map(row)}</ul>
      ) : null}
      {refusalLine(refusal, lore)}
    </div>
  );
}
