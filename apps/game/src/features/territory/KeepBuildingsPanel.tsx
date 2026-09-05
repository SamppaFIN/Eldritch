/**
 * The Keep's Buildings tab (BRDC-KEEP-002).
 *
 * A read-only catalogue: what each Work costs, where it may stand, and the Rite it needs.
 * Placement stays on the map — you build a Work on a cell from its own panel — so this is
 * a reference, not a second build menu. It answers "what can I aim for" in one place.
 */
import { BUILDINGS } from '@es3/core';
import type { BuildingId, ResourcePool } from '@es3/core';
import { BUILDING_NAME, titleCase } from './names.js';
import { BUILDING_BLURB, buildingEffect, renderEffect } from './catalogue.js';

const cost = (c: Readonly<Partial<ResourcePool>>): string =>
  (Object.entries(c) as [string, number][]).map(([k, v]) => `${v} ${k}`).join(' · ');

const where = (t: readonly string[] | 'any'): string =>
  t === 'any' ? 'anywhere' : t.map((k) => titleCase(k)).join(' / ');

export function KeepBuildingsPanel() {
  return (
    <div className="hearth-panel__tabbody">
      <p className="hearth-panel__line">Build a Work on a cell from its panel on the map.</p>
      <ul className="hearth-panel__catalogue">
        {(Object.keys(BUILDINGS) as BuildingId[]).map((id) => {
          const b = BUILDINGS[id];
          return (
            <li key={id} className="hearth-panel__catalogue-row">
              <span className="hearth-panel__catalogue-name">{BUILDING_NAME[id]}</span>
              <span className="hearth-panel__catalogue-meta es-numeric">{cost(b.cost)}</span>
              <span className="hearth-panel__catalogue-blurb">{BUILDING_BLURB[id]}</span>
              <span className="hearth-panel__catalogue-gain">{renderEffect(buildingEffect(id))}</span>
              <span className="hearth-panel__catalogue-meta">
                {where(b.terrain)}
                {b.tech ? ` · needs ${titleCase(b.tech)}` : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
